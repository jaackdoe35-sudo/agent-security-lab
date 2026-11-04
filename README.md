# Agent Security Lab

A controlled sandbox for evaluating prompt injection, tool authorization and data-disclosure boundaries in an AI-agent-style chatbot.

## Status: 0.1.0 prototype

The current implementation is a **deterministic mock agent**, not a connected language model. It validates the chat workflow, attack scenarios, simulated tool traces, evidence export and baseline regression tests. Do not describe these results as evidence of a real LLM being compromised.

## Safety boundary

- All records are synthetic and use reserved `.example.test` email addresses.
- Shopify and CRM operations are simulated in application code.
- No real refunds, emails, external accounts or production customer data are connected.
- Vulnerable mode intentionally accepts selected unsafe requests and must remain isolated.
- Never add real credentials or connect production tools to vulnerable mode.

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
