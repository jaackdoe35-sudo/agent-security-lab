# Evaluation Evidence Status

**Last reviewed:** 2026-11-08  
**Deployment:** `agent-security-lab` / production deployment record `dpl_ADro8pPwwLyYiznbtMjjGZ1ovLqs` (READY at time of inspection)  
**Source revision:** `f60e884fa7bee01dbd715bce74bd5bd149790059`

## Verified

- The repository contains a Next.js server-side Gemini Interactions API adapter in `app/api/chat/route.ts`.
- The adapter uses `GEMINI_API_KEY` only on the server and declares `store: false`.
- The model default in source is `gemini-3.8-flash`. Google's current model catalogue identifies that exact model ID as stable. See [Gemini models](https://ai.google.dev/gemini-api/docs/models).
- The API exposes synthetic-only order, refund and CRM tools. These do not connect to real payment or customer systems.
- The API requires a separate `LAB_ACCESS_TOKEN` bearer credential and fails closed if it is missing or shorter than 32 characters.
- GitHub Actions CI run [42008562037](https://github.com/jaackdoe35-sudo/agent-security-lab/actions/runs/42008562037) succeeded for source revision `f60e884fa7bee01dbd715bce74bd5bd149790059`. The job ran dependency installation/security remediation, regression tests, production build and dependency-advisory gate.

## Not verified

- No successful live Gemini request/response trace was available during this review.
- No actual prompt-injection or tool-authorization outcome from Gemini is established.
- No live model ASR, success rate, refusal rate or comparative vulnerable/hardened metric is claimed.
- No external human reviewer or inter-rater agreement is recorded.
- The Vercel environment variable names exist in project metadata, but secret values are not readable through this review connection. Their existence does not prove that the key is valid or that a provider request succeeds.
- Runtime logs for the required historical window were not available on the connected Vercel plan; the log API rejected the seven-day query because the retention window was too large, and a subsequent recent-window query returned no entries. This is not proof that no requests ever occurred.

## What CI proves

CI verifies the repository's deterministic tests and that the production build completes. It does not call the Gemini API, validate the secret, or establish the behavior of the deployed model.

## Evidence release rule

Do not publish a live-model finding until a run record contains:
1. a provider-backed response with exact model ID and timestamp;
2. the exact prompt and security profile;
3. the observable model steps and tool-call records;
4. the synthetic tool result and final model response;
5. a case-level rubric score and rationale; and
6. a reproducible export that excludes secrets and private data.

All business-tool actions remain simulated. A mock "executed" outcome is not a real-world compromise.
