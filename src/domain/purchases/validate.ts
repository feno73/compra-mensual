import type { PurchaseMonth } from "./types";

export function validatePurchaseHistory(months: PurchaseMonth[]): string[] {
  const issues: string[] = [];
  const digests = new Set<string>();

  for (const month of months) {
    for (const ticket of month.tickets) {
      if (digests.has(ticket.sourceDigest)) issues.push(`Ticket duplicado: ${ticket.sourceDigest}`);
      digests.add(ticket.sourceDigest);
      if (!ticket.purchaseDate.startsWith(month.month)) issues.push(`La fecha ${ticket.purchaseDate} no corresponde a ${month.month}`);

      const gross = ticket.lines.reduce((total, line) => total + line.grossCents, 0);
      const discounts = ticket.lines.flatMap((line) => line.discounts).reduce((total, discount) => total + discount.amountCents, 0);
      const paid = ticket.lines.reduce((total, line) => total + line.netCents, 0)
        + ticket.adjustments.reduce((total, adjustment) => total + adjustment.amountCents, 0);

      if (gross !== ticket.totals.grossCents) issues.push(`El total bruto no reconcilia en ${month.month}`);
      if (discounts !== ticket.totals.discountCents) issues.push(`El total de descuentos no reconcilia en ${month.month}`);
      if (paid !== ticket.totals.paidCents) issues.push(`El total pagado no reconcilia en ${month.month}`);
      if (ticket.exchangeRate.effectiveDate > ticket.exchangeRate.nominalDate) issues.push(`La cotización MEP de ${month.month} es posterior a la compra`);
    }

    const previousMonth = months
      .filter((candidate) => candidate.month < month.month)
      .sort((left, right) => left.month.localeCompare(right.month))
      .at(-1);
    if (month.substitutions.length === 0 || !previousMonth) continue;

    const previousIds = new Set(previousMonth.tickets.flatMap((ticket) => ticket.lines.map((line) => line.product.id)));
    const currentIds = new Set(month.tickets.flatMap((ticket) => ticket.lines.map((line) => line.product.id)));
    const usedIds = new Set<string>();

    for (const substitution of month.substitutions) {
      for (const id of substitution.previousProductIds) {
        if (!previousIds.has(id)) issues.push(`${id} no existe en el mes anterior para ${substitution.id}`);
        if (currentIds.has(id)) issues.push(`${id} no es un producto ausente en ${substitution.id}`);
        if (usedIds.has(id)) issues.push(`${id} participa en más de una sustitución`);
        usedIds.add(id);
      }
      for (const id of substitution.currentProductIds) {
        if (!currentIds.has(id)) issues.push(`${id} no existe en el mes actual para ${substitution.id}`);
        if (previousIds.has(id)) issues.push(`${id} no es un producto nuevo en ${substitution.id}`);
        if (usedIds.has(id)) issues.push(`${id} participa en más de una sustitución`);
        usedIds.add(id);
      }
    }
  }

  return issues;
}
