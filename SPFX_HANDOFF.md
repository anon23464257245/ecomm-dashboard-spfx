# SPFx handoff — copy this frontend into `src/app`

This Vite app is prepared to drop into an **SPFx 1.24** solution as `src/app`.
The SPFx project lives in a **separate workspace**; this file is the copy checklist.

## Prerequisites (SPFx workspace)

- SPFx **1.24** (React **18.x** exact pin from your scaffold — match it; do not use React 19)
- Node **`>=22.14.0 <23.0.0`** (or `>=24.12.0 <25.0.0`)
- Domain isolation **off** for this first cut (plain `fetch` + CORS to API)
- Thin web part host only; all UI under `src/app`

## Fast path (recommended)

From `frontend/`:

```bash
npm install
npm run spfx:export
```

That writes a lean tree (import-graph from `App.tsx` only) plus prebuilt CSS:

```
frontend/dist-spfx/
  app/                 → copy to <spfx>/src/app/
  webpart/             → adapt into <spfx>/src/webparts/analytics/
  DEPENDENCIES.md      → npm packages to install in SPFx
  MANIFEST.txt
```

Then in the SPFx project:

1. Copy `dist-spfx/app/` → `src/app/`
2. Adapt `dist-spfx/webpart/AnalyticsWebPart.ts` (+ manifest) into your web part
3. Install packages from `dist-spfx/DEPENDENCIES.md` (keep SPFx’s React pins)
4. Map `@/*` → `src/app/*` in SPFx `tsconfig`
5. Set property pane `apiBaseUrl` to your API origin
6. `heft start` / bundle

Do **not** import `src/app/spfx.css` or `src/app/index.css` from Heft — import the prebuilt **`src/app/styles/app.css`**.

Fonts (`Geist` + Denton) load from [`src/app-fonts.ts`](src/app-fonts.ts) via `App` — no Vite `main.tsx` required.

## Manual copy map (if not using the export)

| Source (this repo) | Destination (SPFx) | Notes |
| --- | --- | --- |
| `frontend/src/App.tsx` | `src/app/App.tsx` | Host mounts this |
| `frontend/src/spfx.css` + `app-theme.css` | `src/app/` | Prefer prebuilding (below) |
| `frontend/src/components/` | `src/app/components/` | Prefer `spfx:export` trim |
| `frontend/src/pages/` | `src/app/pages/` | |
| `frontend/src/hooks/` | `src/app/hooks/` | |
| `frontend/src/lib/` | `src/app/lib/` | Includes `api-config.ts` |
| `frontend/src/assets/` | `src/app/assets/` | |
| `frontend/src/fonts/` | `src/app/fonts/` | |

**Do not copy** into the web part bundle entry path:

- `frontend/src/main.tsx` — Vite-only (boot splash + `createRoot`)
- `frontend/index.html`, `vite.config.ts`, Vite `public/`

### What the export keeps

`App.tsx` only routes:

- scoreboard (index)
- `dashboards/customers`
- `dashboards/products`
- `dashboards/divisions`
- `dashboards/geography`

Unused PaceUI marketing/login demos and unused template dashboards are omitted when you use `npm run spfx:export`.

## Path alias

In SPFx `tsconfig.json` (and Heft/webpack resolve if required):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/app/*"]
    }
  }
}
```

## Web part host

Stub lives at [`spfx-host/AnalyticsWebPart.ts`](spfx-host/AnalyticsWebPart.ts) (also copied into `dist-spfx/webpart/` on export).

```ts
this.root.render(
  React.createElement(App, {
    apiBaseUrl: this.properties.apiBaseUrl ?? "",
  })
)
```

Property pane: string field `apiBaseUrl`  
Example: `https://your-api.example.com` (no trailing slash).  
Requests become `{apiBaseUrl}/api/executive`, etc.

Empty `apiBaseUrl` keeps relative `/api/...` (Vite proxy only).

## Tailwind / CSS

| File | Role |
| --- | --- |
| `src/index.css` | Vite (full Tailwind including preflight) |
| `src/spfx.css` | SPFx source entry — **no preflight** |
| `src/app-theme.css` | Shared brand tokens / PaceUI theme |
| `styles/app.css` | Generated output for SPFx (`npm run spfx:css` or `spfx:export`) |

Recommendations:

- Import **`styles/app.css`** from the web part only
- Root UI wrapper uses `.apg-analytics-root` so SharePoint `body` is not restyled
- Optional later: Tailwind class prefix (`tw-`) if utilities collide with SPO chrome

Fonts: `app-fonts.ts` pulls `@fontsource-variable/geist` and `fonts/denton.css` (included by export). Install `@fontsource-variable/geist` from `DEPENDENCIES.md`.

## Routing

`App` uses **`HashRouter`**. Deep links look like:

`https://tenant.sharepoint.com/sites/.../page.aspx#/dashboards/customers`

## Local Vite (this repo)

Still supported:

```bash
cd frontend && npm install && npm run dev
```

Uses empty `apiBaseUrl` + Vite `/api` → `localhost:3000` proxy.

## Later (out of this cut)

- Point `apiBaseUrl` at API Gateway / Lambdas
- Add auth (Cognito, Entra, signed fetch) when the API requires it
- Retire Vite once workbench parity is enough for day-to-day work
