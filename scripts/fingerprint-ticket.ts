import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [input] = process.argv.slice(2);
if (!input) throw new Error("Uso: tsx scripts/fingerprint-ticket.ts <ticket>");
const bytes = await readFile(input);
console.log(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
