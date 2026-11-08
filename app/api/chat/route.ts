import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { authorizeLabRequest, checkRateLimit } from "@/lib/access";
import { runAgent, type Mode } from "@/lib/agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 16_384) {
    return NextResponse.json({ error: "Request body exceeds 16 KB." }, { status: 413 });
  }

  const access = authorizeLabRequest(request.headers.get("authorization"));
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const clientKey = createHash("sha256")
    .update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown")
    .digest("hex");
  const rate = checkRateLimit(clientKey);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.error }, { status: rate.status });
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) return NextResponse.json({ error: "Request body exceeds 16 KB." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Malformed JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { message, mode } = body as { message?: unknown; mode?: unknown };
    if (typeof message !== "string" || !message.trim() || message.length > 6000) {
      return NextResponse.json({ error: "Message must contain 1–6000 characters." }, { status: 400 });
    }

    if (mode !== "vulnerable" && mode !== "hardened") return NextResponse.json({ error: "Mode must be vulnerable or hardened." }, { status: 400 });
    const selectedMode: Mode = mode as Mode;
    const result = runAgent(message, selectedMode);
    const startedAt = new Date().toISOString();
    const evidence = {
      schemaVersion: "1.0",
      runId: randomUUID(),
      startedAt,
      completedAt: new Date().toISOString(),
      provider: "deterministic-mock",
      model: "deterministic-mock",
      liveModelEvidence: false,
      mode: selectedMode,
      input: message,
      scenario: result.scenario,
      outcome: result.outcome,
      reply: result.reply,
      events: result.events,
      toolCalls: result.events.filter((event) => event.type === "tool_call").map((event) => ({ message: event.message, allowed: event.allowed ?? false })),
      limitation: "This deployed workbench uses deterministic mock logic only. Live free-model evaluations are run separately with scripts/free-model-evaluation.mjs and are not routed through this API."
    };

    return NextResponse.json({
      ...result,
      provider: "mock",
      model: "deterministic-mock",
      evidence
    });
  } catch (error) {
    console.error("Agent Security Lab request failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "The mock evaluation request failed." }, { status: 400 });
  }
}
