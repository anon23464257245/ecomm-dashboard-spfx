# ecomm-analytics-dashboard

SPFx **1.24.0-beta.3** shell hosting the BigCommerce analytics React app under `src/app`.

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.24.0--beta.3-green.svg)

## Minimal Path to Awesome

- Node `>=22.14.0 <23.0.0`
- `npm install`
- `npm start` (Heft workbench) or `npm run build`

## Architecture

- Thin web part: `src/webparts/ecommAnalytics/EcommAnalyticsWebPart.ts`
- React app: `src/app` (HashRouter dashboards)
- Property pane: `apiBaseUrl` → `{apiBaseUrl}/api/...`
- Styles: import prebuilt `src/app/styles/app.css` only (not `spfx.css` / `index.css`)
- Path alias: `@/*` → `src/app/*` (TS) / `lib/app/*` (webpack)

See `SPFX_HANDOFF.md` for the frontend export checklist.
