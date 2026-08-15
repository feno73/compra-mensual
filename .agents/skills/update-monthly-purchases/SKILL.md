---
name: update-monthly-purchases
description: Use when el usuario solicite incorporar, analizar o comparar un nuevo ticket mensual de supermercado, recibido por URL, imagen o PDF.
---

# Actualizar compras mensuales

## Principio

El ticket es la evidencia: no inventar nombres, cantidades, precios, descuentos ni identidades. Una ambigüedad bloquea la actualización hasta solicitar confirmación.

## Flujo obligatorio

1. Leer completamente cada ticket entregado, incluida toda nota, promoción y sección de totales.
2. Extraer cada línea con nombre original, códigos, cantidad, unidad, precio unitario, bruto y cada descuento.
3. Identificar total bruto, descuentos, ajustes y total pagado; ignorar IVA incluido como cargo adicional.
4. Normalizar nombres y categorías usando códigos estables: priorizar `gtin:*` y usar SKU/PLU con namespace del comercio. Una identidad manual exige evidencia confirmada.
5. Calcular SHA-256 de los bytes fuente y buscar el digest en todo `data/purchases/`; detenerse si es un ticket duplicado.
6. Obtener el dólar MEP vendedor de fin de jornada desde un snapshot versionado de ArgentinaDatos. Si no existe la fecha, usar el registro anterior más reciente y guardar ambas fechas.
7. Generar `data/purchases/YYYY-MM.json` en centavos enteros. Para HTML Coto verificable, usar `pnpm import:coto -- <entrada> <salida> <mep-centavos> <commit-fuente>`.
8. Ejecutar `pnpm validate`: la suma de cada línea, descuentos y ajustes debe coincidir con el total. Solo se admite un centavo si queda como ajuste explícito.
9. Comparar contra el mes anterior y todo el historial disponible; separar coincidencias exactas de sustituciones inferidas y comprobar reconciliación exacta.
10. Actualizar únicamente el JSON mensual, la cotización versionada y otros archivos derivados realmente necesarios. Una corrección histórica debe ser explícita.
11. Ejecutar las pruebas y validaciones con `pnpm check`, `pnpm test`, `pnpm build` y `pnpm test:e2e`; revisar visualmente la aplicación en escritorio y móvil.
12. Entregar un resumen de cambios, totales, MEP, comparación, validaciones y cualquier dato ambiguo.

## Si algo no se lee con confianza

Señalar la línea exacta y solicitar confirmación. No crear ni modificar el JSON mensual y no dejar cambios parciales.

## Referencia rápida

| Control | Resultado requerido |
|---|---|
| Duplicado | Digest inexistente en todo el historial |
| Ticket | Bruto − descuentos + ajustes = pagado |
| Comparación | Factores = diferencia mensual exacta |
| Privacidad | Sin factura, cliente, pago ni URL del ticket |
| Repetición | Segunda ejecución sin cambios semánticos |

## Errores comunes

- No asociar productos solo por nombre o categoría.
- No atribuir un ajuste general a una línea arbitraria.
- No llamar “cierre oficial” a la cotización de ArgentinaDatos.
- No afirmar “nunca lo comprás” con historial insuficiente.
- No hacer push, merge, deploy ni despliegue salvo pedido expreso.
