import crypto from "node:crypto";

const AUTH_URL = "https://login.uber.com/oauth/v2/token";
const API_BASE = "https://api.uber.com/v1/customers";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.UBER_DIRECT_CLIENT_ID!,
      client_secret: process.env.UBER_DIRECT_CLIENT_SECRET!,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }),
  });
  if (!res.ok) throw new Error(`Uber Direct auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function uberFetch(path: string, init: RequestInit) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/${process.env.UBER_DIRECT_CUSTOMER_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Uber Direct ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface DeliveryQuote {
  id: string;
  fee: number; // cents
  currency: string;
  currency_type: string;
  expires: string;
  dropoff_eta: string;
  duration: number;
}

export function getDeliveryQuote(pickupAddress: string, dropoffAddress: string): Promise<DeliveryQuote> {
  return uberFetch("/delivery_quotes", {
    method: "POST",
    body: JSON.stringify({ pickup_address: pickupAddress, dropoff_address: dropoffAddress }),
  });
}

export interface CreateDeliveryParams {
  quoteId: string;
  pickupName: string;
  pickupAddress: string;
  pickupPhone: string;
  dropoffName: string;
  dropoffAddress: string;
  dropoffPhone: string;
  manifestItems: { name: string; quantity: number }[];
  externalId: string;
}

export interface UberDelivery {
  id: string;
  status: string;
  tracking_url: string;
  fee: number;
  currency: string;
  courier: { name?: string; phone_number?: string; location?: { lat: number; lng: number } } | null;
}

export function createDelivery(params: CreateDeliveryParams): Promise<UberDelivery> {
  return uberFetch("/deliveries", {
    method: "POST",
    body: JSON.stringify({
      quote_id: params.quoteId,
      pickup_name: params.pickupName,
      pickup_address: params.pickupAddress,
      pickup_phone_number: params.pickupPhone,
      dropoff_name: params.dropoffName,
      dropoff_address: params.dropoffAddress,
      dropoff_phone_number: params.dropoffPhone,
      manifest_items: params.manifestItems,
      external_id: params.externalId,
    }),
  });
}

export function getDelivery(deliveryId: string): Promise<UberDelivery> {
  return uberFetch(`/deliveries/${deliveryId}`, { method: "GET" });
}

// Maps Uber Direct's delivery status to our own order_status enum. Uber's
// "dropoff" (en route to dropoff) has no distinct value in our enum, so it
// folds into "picked_up" -- the tracker UI still shows forward progress via
// the live courier location/eta from the webhook payload.
const STATUS_MAP: Record<string, string | undefined> = {
  pending: "packing",
  pickup: "courier_assigned",
  pickup_complete: "picked_up",
  dropoff: "picked_up",
  delivered: "delivered",
  canceled: "cancelled",
};

export function mapUberStatus(uberStatus: string): string | undefined {
  return STATUS_MAP[uberStatus];
}

// Uber Direct signs webhook payloads with HMAC-SHA256 over the raw body,
// sent in the X-Uber-Signature header.
export function verifyUberWebhookSignature(rawBody: string, signature: string | null): boolean {
  const signingKey = process.env.UBER_DIRECT_WEBHOOK_SIGNING_KEY;
  if (!signingKey || !signature) return false;
  const expected = crypto.createHmac("sha256", signingKey).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
