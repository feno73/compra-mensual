import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";

const skillPath = ".agents/skills/update-monthly-purchases/SKILL.md";

test("el skill se descubre al incorporar, analizar o comparar tickets mensuales", async () => {
  const skill = await readFile(skillPath, "utf8");
  expect(skill).toMatch(/^---\r?\nname: update-monthly-purchases\r?\ndescription: Use when .*incorporar.*analizar.*comparar.*ticket.*supermercado/im);
});

test("el skill cubre el flujo mensual completo y bloquea ambigüedades", async () => {
  const skill = await readFile(skillPath, "utf8");
  for (const requirement of [
    "leer completamente", "cada línea", "total bruto", "códigos estables", "duplicado",
    "JSON", "suma", "mes anterior", "historial", "archivos derivados", "pruebas", "build",
    "revisar visualmente", "solicitar confirmación", "dólar MEP",
  ]) expect(skill.toLocaleLowerCase("es-AR")).toContain(requirement.toLocaleLowerCase("es-AR"));
  expect(skill).toMatch(/no (?:hacer|hagas) (?:push|merge|deploy|despliegue)/i);
});

test("el skill exige confirmar sustituciones dudosas antes de recalcular", async () => {
  const skill = (await readFile(skillPath, "utf8")).toLocaleLowerCase("es-AR");
  for (const requirement of [
    "productos nuevos y ausentes",
    "equivalencias estrictas",
    "función, formato y cantidad",
    "preguntar",
    "reemplazos confirmados",
    "recalcular",
  ]) expect(skill).toContain(requirement);
});
