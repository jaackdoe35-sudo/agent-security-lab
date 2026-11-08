import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeLabRequest, checkRateLimit } from "@/lib/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // This is a best-effort per-instance attempt limit, not a distributed control.
  const clientKey = createHash("sha256")
    .update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown")
    .digest("hex");
  const rate = checkRateLimit(`access:${clientKey}`);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.error }, { status: rate.status });
  }

  const access = authorizeLabRequest(request.headers.get("authorization"));
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  return NextResponse.json({ authenticated: true });
}
