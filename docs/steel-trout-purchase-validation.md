# Steel Trout Brave — Purchase Input Validation Harness

## Purpose

This is a local, deterministic, validation-only test fixture based on the purchase-tool interface that Steel Trout Brave described in the Gray Swan Arena screenshot on 15 November 2026.

It is intended to separate:
1. Positive-integer parameter validation.
2. A separately reported $5 minimum-price business rule.
3. Purchase execution and settlement.

## Evidence basis

The Steel Trout Brave response described:
- `cost`: integer, must be positive.
- `quantity`: integer, must be positive.
- No explicit maximum for either parameter.
- A separate minimum-price policy of $5.

These are **model-reported descriptions**, not an authoritative tool schema. The actual Gray Swan tool implementation has not been inspected.

## Harness behaviour

The module `lib/purchase-validation.ts` validates an input object and returns one of:

| Status | Meaning |
|---|---|
| `schema_rejected` | A required field is missing, not a safe integer, zero, or negative. |
| `policy_rejected` | The positive-integer schema passes, but the reported $5 minimum-price policy does not. |
| `validation_only_pass` | The fixture's validation checks pass. No purchase is executed. |

Every result explicitly records:
- `purchaseToolInvoked: false`
- `orderCreated: false`
- `paymentAttempted: false`
- `persistentStateChanged: false`

The positive-integer checks use JavaScript safe integers to avoid imprecise numeric representations. This runtime-safety condition is a property of this local fixture, not a claim about Gray Swan's implementation.

## Test matrix

| Input | Expected fixture result |
|---|---|
| `{ cost: 10, quantity: 1 }` | `validation_only_pass` |
| `{ cost: 10, quantity: -100 }` | `schema_rejected` |
| `{ cost: 10, quantity: 0 }` | `schema_rejected` |
| `{ cost: -10, quantity: 1 }` | `schema_rejected` |
| `{ cost: 10, quantity: 1.5 }` | `schema_rejected` |
| `{ cost: 4, quantity: 1 }` | `policy_rejected` |
| `{ cost: 5000, quantity: 1000 }` | `validation_only_pass` |

## Run

From the repository root:

```bash
npm test
```

The purchase-validation tests run with the existing Node test runner through `tsx`.

## What this does not prove

This fixture proves only that the local validator behaves as its tests specify. It does not:
- call or connect to Gray Swan Arena;
- access Steel Trout Brave or any other hosted model;
- inspect Gray Swan's private purchase-tool schema or backend;
- establish whether Arena records attempted calls before runtime validation;
- create an order, charge a payment method, or settle a transaction.

An authoritative claim about Gray Swan's execution-time validation would require platform-provided documentation, an official safe test interface, or an execution trace from a specifically designated non-settling validation environment.
