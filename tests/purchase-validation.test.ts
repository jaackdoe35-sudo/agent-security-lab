import test from "node:test";
import assert from "node:assert/strict";
import { validatePurchaseInput } from "../lib/purchase-validation";

test("valid positive-integer input passes validation only and never executes", () => {
  const result = validatePurchaseInput({ cost: 10, quantity: 1 });

  assert.equal(result.status, "validation_only_pass");
  assert.equal(result.schemaValid, true);
  assert.equal(result.policyValid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.sideEffects, {
    purchaseToolInvoked: false,
    orderCreated: false,
    paymentAttempted: false,
    persistentStateChanged: false,
  });
});

test("the challenge's negative quantity is rejected at schema validation", () => {
  const result = validatePurchaseInput({ cost: 10, quantity: -100 });

  assert.equal(result.status, "schema_rejected");
  assert.equal(result.schemaValid, false);
  assert.ok(result.errors.includes("quantity must be a positive integer."));
  assert.equal(result.sideEffects.purchaseToolInvoked, false);
  assert.equal(result.sideEffects.orderCreated, false);
  assert.equal(result.sideEffects.paymentAttempted, false);
  assert.equal(result.sideEffects.persistentStateChanged, false);
});

test("zero quantity is rejected", () => {
  const result = validatePurchaseInput({ cost: 10, quantity: 0 });

  assert.equal(result.status, "schema_rejected");
  assert.ok(result.errors.includes("quantity must be a positive integer."));
});

test("negative cost is rejected", () => {
  const result = validatePurchaseInput({ cost: -10, quantity: 1 });

  assert.equal(result.status, "schema_rejected");
  assert.ok(result.errors.includes("cost must be a positive integer."));
});

test("zero cost is rejected", () => {
  const result = validatePurchaseInput({ cost: 0, quantity: 1 });

  assert.equal(result.status, "schema_rejected");
  assert.ok(result.errors.includes("cost must be a positive integer."));
});

test("fractional values are rejected", () => {
  const result = validatePurchaseInput({ cost: 10, quantity: 1.5 });

  assert.equal(result.status, "schema_rejected");
  assert.ok(result.errors.includes("quantity must be a positive integer."));
});

test("numeric strings are rejected rather than coerced", () => {
  const result = validatePurchaseInput({ cost: "10", quantity: "1" });

  assert.equal(result.status, "schema_rejected");
  assert.equal(result.schemaValid, false);
});

test("the reported $5 minimum is evaluated as a separate policy layer", () => {
  const result = validatePurchaseInput({ cost: 4, quantity: 1 });

  assert.equal(result.status, "policy_rejected");
  assert.equal(result.schemaValid, true);
  assert.equal(result.policyValid, false);
  assert.match(result.errors[0], /at least 5/);
  assert.equal(result.sideEffects.purchaseToolInvoked, false);
});

test("no arbitrary business maximum is added by this fixture", () => {
  const result = validatePurchaseInput({ cost: 5000, quantity: 1000 });

  assert.equal(result.status, "validation_only_pass");
  assert.equal(result.sideEffects.purchaseToolInvoked, false);
  assert.equal(result.sideEffects.paymentAttempted, false);
});

test("non-object input is rejected", () => {
  const result = validatePurchaseInput(null);

  assert.equal(result.status, "schema_rejected");
  assert.equal(result.schemaValid, false);
  assert.equal(result.sideEffects.purchaseToolInvoked, false);
});
