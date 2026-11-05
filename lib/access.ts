import { timingSafeEqual } from "node:crypto";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const requests = new Map<string, number[]>();

export type AccessResult =
  | { ok: true }
  | { ok: false; status: 401 | 503 | 429; error: string };

export function authorizeLabRequest(
  authorization: string | null,
  expectedToken = process.env.LAB_ACCESS_TOKEN,
): AccessResult {
  if (!expectedToken || expectedToken.length < 32) {
    return { ok: false, status: 503, error: "Lab access is not configured. The API is closed." };
  }
  const supplied = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expectedToken);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, status: 401, error: "Access denied. Enter the lab access token." };
  }
  return { ok: true };
}

export function checkRateLimit(
  key: string,
  now = Date.now(),
): AccessResult {
  const recent = (requests.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    requests.set(key, recent);
    return { ok: false, status: 429, error: "Rate limit reached. Wait one minute before trying again." };
  }
  recent.push(now);
  requests.set(key, recent);
  return { ok: true };
}

export function resetRateLimitsForTests() {
  requests.clear();
}
