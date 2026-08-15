import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { parseCotoTicketHtml } from "../src/domain/purchases/coto";

const [input, output, rate, sourceReference] = process.argv.slice(2);
if (!input || !output || !rate || !sourceReference) {
  throw new Error("Uso: pnpm import:coto <html> <json> <mep-centavos> <commit-fuente>");
}

const html = await readFile(input, "utf8");
const sourceDigest = `sha256:${createHash("sha256").update(html).digest("hex")}`;
const ticket = parseCotoTicketHtml(html, {
  sourceDigest,
  rateCentsPerUsd: Number(rate),
  sourceReference,
  fetchedAt: "2026-08-15",
});
const month = ticket.purchaseDate.slice(0, 7);
const document = { schemaVersion: 1, month, currency: "ARS", tickets: [ticket], substitutions: [] };

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Generado ${output}: ${ticket.lines.length} líneas, ${ticket.totals.paidCents} centavos`);
