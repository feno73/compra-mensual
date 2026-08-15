import { expect, test } from "vitest";

import { assertReconciled } from "../../src/domain/comparison/reconcile";

test("acepta igualdad exacta y rechaza hasta un centavo implícito", () => {
  expect(() => assertReconciled(100n, 100n)).not.toThrow();
  expect(() => assertReconciled(100n, 99n)).toThrow(/1 centavo/i);
});
