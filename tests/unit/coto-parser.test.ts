import { expect, test } from "vitest";

import { parseCotoTicketHtml } from "../../src/domain/purchases/coto";

const html = `
<h2 class="single-title">SUC181 COTO CICSA</h2>
<span class="text-big-grey text-left">Fecha: 10/07/26</span>
<ul class="product-ul">
  <li class="product-li">
    <h2 class="width-80 info-producto-h2">QUESO C/PIMI.NEGRA SANTA ROSA X 1 KGM</h2>
    <div class="width-20 info-producto-price">$9.676,54</div>
    <span class="plu text-light-grey">00000000014565</span>
    <span class="lean text-light-grey">02514565002563</span>
    <div class="width-80 info-descuento desc-banco">MERCADO PAGO 25% - VIERNES</div>
    <div class="width-20 precio-descuento desc-banco">-2.419,13</div>
    <div class="width-80 text-light-grey info-cant">0,256 x $37.798,98</div>
  </li>
</ul>
<span class="text-middle-grey text-left">Subtotal sin descuentos</span>
<span class="text-middle-grey text-right">$9.676,54</span>
<span class="text-middle-grey text-left">Ahorro por línea de cajas</span>
<span class="text-middle-grey text-right">$-2.419,13</span>
<span class="text-bigger-grey text-left">TOTAL</span>
<span class="text-bigger-grey text-right">$7.257,40</span>`;

test("extrae líneas Coto y explicita el centavo de redondeo", () => {
  const ticket = parseCotoTicketHtml(html, {
    sourceDigest: `sha256:${"a".repeat(64)}`,
    rateCentsPerUsd: 153270,
    sourceReference: "0988b5e0ac22f58f8b2044a7adb4d288a90c4009",
    fetchedAt: "2026-08-15",
  });

  expect(ticket.purchaseDate).toBe("2026-07-10");
  expect(ticket.lines).toHaveLength(1);
  expect(ticket.lines[0]).toMatchObject({
    product: { id: "gtin:02514565002563", ticketName: "QUESO C/PIMI.NEGRA SANTA ROSA X 1 KGM" },
    quantity: { value: 256, scale: 3, unit: "kg" },
    unitListPrice: { value: 3779898, scale: 2 },
    grossCents: 967654,
    netCents: 725741,
  });
  expect(ticket.adjustments).toEqual([{ description: "Redondeo informado por conciliación", amountCents: -1, kind: "rounding" }]);
  expect(ticket.totals.paidCents).toBe(725740);
});
