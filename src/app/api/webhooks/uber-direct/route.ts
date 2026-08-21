import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/service";
import { mapUberStatus, verifyUberWebhookSignature } from "@/lib/uber-direct";

// Uber Direct's exact webhook payload shape can only be confirmed once the
// endpoint is registered and a real sandbox event arrives -- this parses
// defensively (a couple of likely field locations) and logs the raw body on
// anything unrecognized so a mismatch is a one-line fix, not a mystery.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-uber-signature");

  if (!verifyUberWebhookSignature(rawBody, signature)) {
    console.error("Uber Direct webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = (payload.data as Record<string, unknown> | undefined) ?? payload;
  const deliveryId = (data.delivery_id ?? data.id) as string | undefined;
  const uberStatus = data.status as string | undefined;

  if (!deliveryId || !uberStatus) {
    console.error("Uber Direct webhook missing delivery id/status", payload);
    Sentry.captureMessage("Uber Direct webhook missing delivery id/status", {
      level: "error",
      extra: { payload },
    });
    return NextResponse.json({ received: true });
  }

  const mappedStatus = mapUberStatus(uberStatus);
  if (!mappedStatus) {
    console.error("Uber Direct webhook: unrecognized status", uberStatus);
    Sentry.captureMessage("Uber Direct webhook: unrecognized status", {
      level: "error",
      extra: { deliveryId, uberStatus },
    });
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: mappedStatus })
    .eq("uber_delivery_id", deliveryId);

  if (error) {
    console.error("Failed to update order status from Uber Direct webhook", error);
    Sentry.captureException(new Error("Failed to update order status from Uber Direct webhook"), {
      extra: { deliveryId, mappedStatus, error },
      tags: { area: "uber_direct_webhook" },
    });
  }

  return NextResponse.json({ received: true });
}
