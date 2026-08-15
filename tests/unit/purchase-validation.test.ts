import { expect, test } from "vitest";

import { validatePurchaseHistory } from "../../src/domain/purchases/validate";
import type { PurchaseMonth } from "../../src/domain/purchases/types";

function month(digest: string, paidCents = 100): PurchaseMonth {
  return {
    schemaVersion: 1,
    month: "2026-07",
    currency: "ARS",
    substitutions: [],
    tickets: [{
      sourceDigest: digest,
      purchaseDate: "2026-07-10",
      merchant: { name: "Coto" },
      exchangeRate: {
        nominalDate: "2026-07-10",
        effectiveDate: "2026-07-10",
        rateCentsPerUsd: 153270,
        source: "ArgentinaDatos",
        sourceField: "venta",
        sourceReference: "0988b5e0ac22f58f8b2044a7adb4d288a90c4009",
        fetchedAt: "2026-08-15",
      },
      lines: [{
        lineId: "1",
        product: { id: "gtin:7790000000001", ticketName: "Producto", normalizedName: "Producto", category: "Sin categorizar" },
        quantity: { value: 1, scale: 0, unit: "unit" },
        unitListPrice: { value: 100, scale: 2, currency: "ARS" },
        grossCents: 100,
        discounts: [],
        netCents: 100,
      }],
      adjustments: [],
      totals: { grossCents: 100, discountCents: 0, paidCents },
    }],
  };
}

test("acepta tickets reconciliados", () => {
  expect(validatePurchaseHistory([month(`sha256:${"a".repeat(64)}`)])).toEqual([]);
});

test("detecta totales inconsistentes", () => {
  expect(validatePurchaseHistory([month(`sha256:${"a".repeat(64)}`, 99)])).toContainEqual(
    expect.stringMatching(/pagado/i),
  );
});

test("detecta una huella duplicada en todo el historial", () => {
  const first = month(`sha256:${"a".repeat(64)}`);
  const second = { ...month(`sha256:${"a".repeat(64)}`), month: "2026-08" } as PurchaseMonth;
  second.tickets[0]!.purchaseDate = "2026-08-14";
  expect(validatePurchaseHistory([first, second])).toContainEqual(expect.stringMatching(/duplicad/i));
});

test("detecta códigos inexistentes y productos repetidos entre sustituciones", () => {
  const previous = month(`sha256:${"a".repeat(64)}`);
  const current = month(`sha256:${"b".repeat(64)}`) as unknown as PurchaseMonth;
  current.month = "2026-08";
  current.tickets[0]!.purchaseDate = "2026-08-14";
  current.tickets[0]!.lines[0]!.product.id = "gtin:7790000000002";
  current.substitutions = [
    {
      id: "primera",
      previousProductIds: ["gtin:7790000000001"],
      currentProductIds: ["gtin:7790000000002"],
      kind: "equivalent",
      reason: "Reemplazo confirmado",
      comparisonBasis: "Una unidad",
      confidence: "confirmed",
    },
    {
      id: "segunda",
      previousProductIds: ["gtin:7790000000001"],
      currentProductIds: ["gtin:7790000000999"],
      kind: "group-replacement",
      reason: "Grupo inválido",
      comparisonBasis: "Prueba",
      confidence: "confirmed",
    },
  ] as typeof current.substitutions;

  const issues = validatePurchaseHistory([previous, current]);
  expect(issues).toContainEqual(expect.stringMatching(/no existe.*actual/i));
  expect(issues).toContainEqual(expect.stringMatching(/más de una sustitución/i));
});
