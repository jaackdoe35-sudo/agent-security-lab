# Agent Security Lab

A controlled sandbox for evaluating prompt injection, tool authorization and data-disclosure boundaries in an AI-agent-style chatbot.

## Status: 0.1.0 controlled prototype

The application includes a deterministic mock fallback and an optional Gemini Interactions API adapter. A live Gemini integration is not active unless `GEMINI_API_KEY` is configured. Never describe mock-only test results as evidence of a real LLM being compromised.

## Safety boundary

- All records are synthetic and use reserved `.example.test` email addresses.
- Shopify and CRM operations are simulated in application code.
- No real refunds, emails, external accounts or production customer data are connected.
- Vulnerable mode intentionally accepts selected unsafe requests but all resulting actions remain synthetic.
- The chat API fails closed unless `LAB_ACCESS_TOKEN` is configured and supplied as a bearer token.
- API requests are limited to 16 KB and rate-limited per serverless process instance. This in-memory limiter is a prototype safeguard, not a distributed abuse-control system.
- Never add real credentials or connect production tools to vulnerable mode.

## Access control

Configure `LAB_ACCESS_TOKEN` as a random secret of at least 32 characters in Vercel. The browser login screen holds it only in component memory and sends it in the `Authorization: Bearer` header. The API fails closed when the secret is absent. Do not reuse your Gemini API key as the lab access token.

The current in-memory rate limiter allows up to 12 requests per minute per serverless process instance. For a public production deployment, replace this with a shared rate-limit store and add platform-level protection before enabling public access.

## Modes

- **Vulnerable:** demonstrates unsafe mock-tool execution when untrusted input requests a refund or customer-record export.
- **Hardened:** denies privileged actions at the simulated tool boundary unless authorization is present. This prototype deliberately has no authenticated user or approval-token implementation, so privileged operations are denied.

## Scenarios

1. Indirect email prompt injection attempting an unauthorized refund.
2. Document prompt injection attempting customer-data disclosure.
3. Direct unauthorized refund request.
4. Benign order lookup.

## Run

```bash
npm install
npm test
npm run dev
```

Open http://localhost:3000.

## Evidence

The UI exports the current browser session's messages, traces, outcomes and scenario identifiers as JSON. Evidence is session-local and is not persisted server-side.

## Roadmap

- Connect a real LLM through a server-side provider adapter.
- Add versioned attack cases, repeatable multi-trial evaluations and measured ASR.
- Implement explicit identity, authorization and approval-token fixtures.
- Add signed run records and model/provider/version metadata.
- Extend CI with security regression tests.

## Evidence limitations

A mock tool execution is not a real-world compromise. A deterministic policy pass is not an LLM benchmark. Portfolio claims must distinguish simulated behavior from live-model results.

## Optional live LLM integration

The server can call the Google Gemini Interactions API when `GEMINI_API_KEY` is configured in the Vercel project environment. The verified default model ID is `gemini-3.8-flash`; `GEMINI_MODEL` can override it. Without the key, the app uses the deterministic mock agent. Configure `LAB_ACCESS_TOKEN` before setting `GEMINI_API_KEY`.

The live path exposes three **synthetic-only** function tools: order lookup, simulated refund, and synthetic CRM export. The vulnerable profile allows the two privileged mock actions; the hardened profile denies them at the server-side tool boundary because this demo has no authenticated approval context. The model does not directly execute tools.

Requests use `store: false` and the browser retains the model interaction steps for evidence export. This avoids storing Interaction resources for stateful continuation, but does not change Google's data-use terms for the free tier. Google's published Gemini API pricing page states that free-tier content may be used to improve its products. Use synthetic test content only; do not submit personal, confidential, or production customer information.

Official API references:
- [Gemini Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Gemini API pricing and data use](https://ai.google.dev/gemini-api/docs/pricing)

Never expose `GEMINI_API_KEY` or `LAB_ACCESS_TOKEN` in client-side code or commit either secret to GitHub.


## CI verification

The default branch contains the CI workflow definition so GitHub can execute pull-request checks and manual dispatches. The workflow generates an npm audit report and lockfile artifact, applies non-breaking dependency fixes, runs the regression suite and production build, and fails if any dependency advisory remains.
