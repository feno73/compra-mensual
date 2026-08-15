# Substitution-Aware Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reclasificar reemplazos confirmados para explicar correctamente la diferencia mensual sin romper la reconciliación exacta.

**Architecture:** Las declaraciones viven en el JSON del mes actual. El dominio valida y transforma productos inicialmente nuevos/ausentes en grupos de sustitución; la interfaz consume el resultado calculado y el skill guía futuras confirmaciones.

**Tech Stack:** TypeScript, Zod, Vitest, Astro y Playwright.

## Global Constraints

- Mantener centavos enteros y cálculos intermedios con `bigint`.
- Ninguna sustitución se infiere solo por nombre o categoría.
- Un producto no puede participar en más de un grupo.
- Los factores deben reconciliar exactamente $64.656,12.
- Preservar el cambio pendiente e independiente de `playwright.config.ts`.
- No hacer commit, push ni deploy sin solicitud expresa.

---

### Task 1: Expandir y validar el contrato de sustituciones

**Files:**
- Modify: `src/domain/purchases/schema.ts`
- Modify: `src/domain/purchases/validate.ts`
- Modify: `tests/unit/schema.test.ts`
- Modify: `tests/unit/purchase-validation.test.ts`

**Interfaces:**
- Produce una sustitución con `id`, `previousProductIds`, `currentProductIds`, `kind`, `reason`, `comparisonBasis` y `confidence: "confirmed"`.

- [ ] Agregar pruebas que rechacen arrays vacíos, códigos inexistentes y productos solapados.
- [ ] Ejecutar las pruebas y confirmar que fallan por el contrato anterior.
- [ ] Implementar el esquema y validación cruzada contra mes anterior/actual.
- [ ] Ejecutar las pruebas hasta obtener verde.

### Task 2: Reclasificar el puente y cargar los reemplazos confirmados

**Files:**
- Modify: `data/purchases/2026-08.json`
- Modify: `src/domain/comparison/compare.ts`
- Modify: `tests/unit/compare.test.ts`
- Modify: `tests/integration/july-august-comparison.test.ts`

**Interfaces:**
- `compareAggregates(previous, current, substitutions)` produce `substitutions`, `factors.substitutionsCents`, nuevos restantes y ausentes restantes.

- [ ] Escribir pruebas uno-a-uno, uno-a-varios, varios-a-varios y reconciliación.
- [ ] Verificar RED con el motor actual.
- [ ] Incorporar las once sustituciones confirmadas en agosto.
- [ ] Calcular bruto, descuentos y neto por grupo; retirar miembros de nuevos/ausentes.
- [ ] Verificar los importes exactos: nuevos $191.877,21; ausentes -$114.082,95; reemplazos -$12.105,49; total $64.656,12.

### Task 3: Actualizar historial e interfaz explicativa

**Files:**
- Modify: `src/domain/history.ts`
- Modify: `src/domain/view-model.ts`
- Modify: `src/components/ChangeBridge.astro`
- Modify: `src/components/CauseRanking.astro`
- Modify: `src/components/PresenceChanges.astro`
- Modify: `src/components/SubstitutionInferences.astro`
- Modify: `src/components/Dashboard.astro`
- Modify: `tests/unit/history.test.ts`
- Modify: `tests/e2e/monthly-purchases.spec.ts`

**Interfaces:**
- El historial recibe sustituciones equivalentes confirmadas y puede encadenar productos distintos sin fusionar sus SKU.

- [ ] Agregar pruebas para continuidad equivalente y render de “Reemplazos confirmados”.
- [ ] Verificar RED.
- [ ] Mostrar Reemplazos en puente/ranking y tarjetas con bruto, descuentos, neto, base y ahorro/gasto.
- [ ] Excluir reemplazados de nuevos/ausentes y destacar el ahorro de leche de $540,02.
- [ ] Ejecutar unitarias y E2E hasta obtener verde.

### Task 4: Reforzar el skill y verificar el sistema completo

**Files:**
- Modify: `.agents/skills/update-monthly-purchases/SKILL.md`
- Modify: `tests/integration/monthly-skill.test.ts`

**Interfaces:**
- El skill obliga a revisar nuevos/ausentes, registrar equivalencias estrictas y preguntar toda duda.

- [ ] Agregar expectativas del flujo de sustituciones al test del skill y verificar RED.
- [ ] Actualizar el skill con detección estricta, preguntas, confirmación y recalculo.
- [ ] Ejecutar `pnpm check`, `pnpm validate`, `pnpm test`, `pnpm build` y `pnpm test:e2e`.
- [ ] Revisar visualmente escritorio/móvil y confirmar ausencia de datos sensibles.
