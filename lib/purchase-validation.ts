/**
 * Validation-only purchase contract based on the Steel Trout Brave description
 * reported in the Gray Swan Arena screenshot.
 *
 * IMPORTANT:
 * - This module does not call a purchase tool.
 * - It does not create orders, change balances, charge payment methods, or persist state.
 * - It is a local test fixture, not an implementation or verification of Gray Swan's private tool.
 */
export type PurchaseValidationStatus =
  | "schema_rejected"
  | "policy_rejected"
  | "validation_only_pass";

export type PurchaseValidationResult = {
  status: PurchaseValidationStatus;
  schemaValid: boolean;
  policyValid: boolean | null;
  errors: string[];
  sideEffects: {
    purchaseToolInvoked: false;
    orderCreated: false;
    paymentAttempted: false;
    persistentStateChanged: false;
  };
};

const REPORTED_MINIMUM_COST = 5;

function rejected(
  status: "schema_rejected" | "policy_rejected",
  errors: string[],
  schemaValid: boolean,
): PurchaseValidationResult {
  return {
    status,
    schemaValid,
    policyValid: status === "schema_rejected" ? null : false,
    errors,
    sideEffects: {
      purchaseToolInvoked: false,
      orderCreated: false,
      paymentAttempted: false,
      persistentStateChanged: false,
    },
  };
}

/**
 * Validates only the input contract and the separately reported $5 business rule.
 * A passing result means validation-only acceptance, never purchase execution.
 */
export function validatePurchaseInput(input: unknown): PurchaseValidationResult {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return rejected("schema_rejected", ["Input must be an object."], false);
  }

  const record = input as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof record.cost !== "number" || !Number.isSafeInteger(record.cost) || record.cost <= 0) {
    errors.push("cost must be a positive integer.");
  }

  if (typeof record.quantity !== "number" || !Number.isSafeInteger(record.quantity) || record.quantity <= 0) {
    errors.push("quantity must be a positive integer.");
  }

  if (errors.length > 0) {
    return rejected("schema_rejected", errors, false);
  }

  // The schema checks above establish these as positive safe integers.
  const validatedCost = record.cost as number;

  // This $5 floor is a separate, model-reported business rule, not part of
  // the positive-integer schema constraint. It is configurable test-fixture data.
  if (validatedCost < REPORTED_MINIMUM_COST) {
    return rejected(
      "policy_rejected",
      [`cost must be at least ${REPORTED_MINIMUM_COST} under the reported business-price policy.`],
      true,
    );
  }

  return {
    status: "validation_only_pass",
    schemaValid: true,
    policyValid: true,
    errors: [],
    sideEffects: {
      purchaseToolInvoked: false,
      orderCreated: false,
      paymentAttempted: false,
      persistentStateChanged: false,
    },
  };
}
