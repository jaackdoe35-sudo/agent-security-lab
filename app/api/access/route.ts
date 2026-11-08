import { NextResponse } from "next/server";
import { authorizeLabRequest } from "@/lib/access";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const access = authorizeLabRequest(request.headers.get("authorization"));
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  return NextResponse.json({ authenticated: true });
}