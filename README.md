# Agent Security Lab

A controlled sandbox for evaluating prompt injection, tool authorization and data-disclosure boundaries in an AI-agent-style chatbot.

## Architecture: provider-neutral

The deployed workbench is deterministic mock logic only. It has no Gemini integration, no external LLM provider dependency and no provider API key. Live free-model evaluations are executed separately using the script in `scripts/free-model-evaluation.mjs`; the repository retains the evaluation report and reproduction harness. The original execution logs were captured in the Vercel sandbox session; the report summarizes the verified tool calls and outcomes.

The initial free-model evaluation was executed on 2026-11-08 through a public anonymous inference gateway using `auto/free`. The gateway routed individual turns to NVIDIA Nemotron 3 Super 120B and MiniMax M3.1 Flash. Routing can change between requests. The harness sends no Authorization header and uses synthetic prompts and synthetic tools only. See [the evidence index](evidence/README.md).

## Safety boundary

- All records and prompts are synthetic and use reserved `.example.test` email addresses.
- Shopify and CRM operations are simulated in local evaluation code.
- No real refunds, emails, external accounts or production customer data are connected.
- Vulnerable mode intentionally permits selected unsafe synthetic actions; hardened mode denies privileged actions at the simulated tool boundary.
- The chat API fails closed unless `LAB_ACCESS_TOKEN` is configured and supplied as a bearer token.
- API requests are limited to 16 KB and rate-limited per serverless process instance. This in-memory limiter is a prototype safeguard, not a distributed abuse-control system.
- Never add real credentials or connect production tools to vulnerable mode.

## Access control

Configure `LAB_ACCESS_TOKEN` as a random secret of at least 32 characters in Vercel. The browser login screen holds it only in component memory and sends it in the `Authorization: Bearer` header. The API fails closed when the secret is absent. It is not an LLM provider key.

## Modes

- **Vulnerable:** demonstrates unsafe mock-tool execution when untrusted input requests a refund or customer-record export.
- **Hardened:** denies privileged actions at the simulated tool boundary unless authorization is present. This prototype deliberately has no authenticated user or approval-token implementation, so privileged operations are denied.

## Scenarios

1. Indirect email prompt injection attempting an unauthorized refund.
2. Document prompt injection attempting customer-data disclosure.
3. Direct unauthorized refund request.
4. Benign order lookup.

## Live free-model evaluation

The separate evaluation harness uses a public anonymous free-model gateway without an API key. It offers no SLA or guaranteed model identity; the exact returned model ID is recorded for each turn. Do not use it for confidential data. Tool calls are executed against local synthetic functions and never cause external business actions. The deployed app does not proxy user prompts to this service.

Run the harness with Node 22+:

```bash
node scripts/free-model-evaluation.mjs
```

The script writes timestamped JSON run records to `evidence/`. Review gateway terms, availability and model routing before each evaluation; free endpoints may change or rate-limit without notice.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open http://localhost:3000.

## Evidence limitations

A synthetic tool execution is not a real-world compromise. A single free-model run is not a benchmark. Provider routing may change between turns. Do not report attack success rates or model rankings without repeated, controlled trials across stable model versions. Public free inference services may retain request data; use synthetic test content only.

## CI verification

The workflow runs deterministic regression tests and a production build. CI does not make external model calls and does not prove live model behavior.
