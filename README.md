# Compras mensuales

Sitio estático para validar, visualizar y comparar compras mensuales de supermercado.

## Ejecutar

Requiere Node.js 22+ y pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Validar

```bash
pnpm check
pnpm validate
pnpm test
pnpm build
pnpm exec playwright install chromium firefox
pnpm test:e2e
```

El resultado publicable queda en `dist/`.

## Actualizar un mes

Usar `.agents/skills/update-monthly-purchases/SKILL.md`. Los tickets originales se guardan temporalmente en `.private/tickets/`, que Git ignora.

Para un ticket HTML de Coto ya revisado:

```bash
pnpm import:coto -- .private/tickets/ticket.html data/purchases/2026-09.json 150000 <commit-de-ArgentinaDatos>
pnpm validate
```

Si una URL falla, usar una imagen o PDF completo. No incorporar líneas ilegibles sin confirmación.

## Publicar en GitHub Pages

1. Subir el repositorio a GitHub.
2. En **Settings → Pages → Source**, elegir **GitHub Actions**.
3. Integrar los cambios en `main` o ejecutar manualmente el workflow **Deploy GitHub Pages**.
4. Abrir la URL informada por el job `deploy`.

El workflow deriva automáticamente la ruta base a partir del nombre del repositorio.
