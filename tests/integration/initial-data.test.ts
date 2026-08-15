import { expect, test } from "vitest";

import { toUsdCents } from "../../src/domain/money";
import { loadPurchaseMonths } from "../../src/domain/purchases/load";
import { validatePurchaseHistory } from "../../src/domain/purchases/validate";

test("los tickets iniciales reproducen líneas, totales y MEP verificados", async () => {
  const [july, august] = await loadPurchaseMonths();
  expect(july?.tickets[0]?.lines).toHaveLength(59);
  expect(august?.tickets[0]?.lines).toHaveLength(64);
  expect(july?.tickets[0]?.totals.paidCents).toBe(26_739_016);
  expect(august?.tickets[0]?.totals.paidCents).toBe(33_204_628);
  expect(33_204_628 - 26_739_016).toBe(6_465_612);
  expect(toUsdCents(26_739_016n, 153_270n)).toBe(17_446n);
  expect(toUsdCents(33_204_628n, 152_160n)).toBe(21_822n);
  expect(validatePurchaseHistory([july!, august!])).toEqual([]);
});

test("los JSON públicos no contienen URLs de tickets ni datos de pago", async () => {
  const serialized = JSON.stringify(await loadPurchaseMonths());
  expect(serialized).not.toMatch(/https?:\/\//i);
  expect(serialized).not.toMatch(/factura|cliente|tarjeta|medio.?de.?pago/i);
});
