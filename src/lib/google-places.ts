import type { GooglePlacesMatchStatus } from "@/lib/supabase/types";

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";

export interface PlacesVerificationResult {
  placeId: string | null;
  name: string | null;
  formattedAddress: string | null;
  matchStatus: GooglePlacesMatchStatus;
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

// Jaccard similarity over word tokens -- a coarse heuristic on purpose. This
// only has to be good enough to flag likely mismatches for a human admin to
// glance at; the admin queue shows the claimed vs. returned name/address side
// by side so a bad heuristic call here is a minor annoyance, not a hard gate.
function similarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

const MATCH_THRESHOLD = 0.35;

export async function verifyBusinessListing(
  claimedName: string,
  claimedAddress: string,
): Promise<PlacesVerificationResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { placeId: null, name: null, formattedAddress: null, matchStatus: "error" };
  }

  const res = await fetch(SEARCH_TEXT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: `${claimedName}, ${claimedAddress}` }),
  });

  if (!res.ok) {
    return { placeId: null, name: null, formattedAddress: null, matchStatus: "error" };
  }

  const data = (await res.json()) as {
    places?: { id: string; displayName?: { text: string }; formattedAddress?: string }[];
  };

  if (!data.places || data.places.length === 0) {
    return { placeId: null, name: null, formattedAddress: null, matchStatus: "not_found" };
  }

  const candidate = data.places[0];
  const candidateName = candidate.displayName?.text ?? "";
  const candidateAddress = candidate.formattedAddress ?? "";
  const nameScore = similarity(claimedName, candidateName);
  const addressScore = similarity(claimedAddress, candidateAddress);
  const combined = nameScore * 0.5 + addressScore * 0.5;

  return {
    placeId: candidate.id,
    name: candidateName || null,
    formattedAddress: candidateAddress || null,
    matchStatus: combined >= MATCH_THRESHOLD ? "matched" : "mismatch",
  };
}
