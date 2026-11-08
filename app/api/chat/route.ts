import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { authorizeLabRequest, checkRateLimit } from "@/lib/access";
import { readBoundedJson, RequestBodyTooLargeError } from "@/lib/request-body";
import { runAgent, type Mode } from "@/lib/agent";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body exceeds 16 KB." }, { status: 413 });
  }

  const access = authorizeLabRequest(request.headers.get("authorization"));
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Best-effort per-instance limiter; serverless instances do not share this Map.
  const clientKey = createHash("sha256")
    .update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown")
    .digest("hex");
  const rate = checkRateLimit(`chat:${clientKey}`);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.error }, { status: rate.status });
  }

  try {
    let body: unknown;
    try {
      body = await readBoundedJson(request.body, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: error.message }, { status: 413 });
      }
      return NextResponse.json({ error: "Malformed or missing JSON request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { message, mode } = body as { message?: unknown; mode?: unknown };
    if (typeof message !== "string" || !message.trim() || message.length > 6000) {
      return NextResponse.json({ error: "Message must contain 1–6000 characters." }, { status: 400 });
    }
    if (mode !== "vulnerable" && mode !== "hardened") {
      return NextResponse.json({ error: "Mode must be vulnerable or hardened." }, { status: 400 });
    }

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
      toolCalls: result.events.filter((event) => event.type === "tool_call").map((event) => ({
        message: event.message,
        allowed: event.allowed ?? false
      })),
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
