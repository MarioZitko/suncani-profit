# Sunčani Profit

Solar panel ROI calculator for Croatia. Enter your location and system size to get production estimates powered by the EU PVGIS API, with financial projections based on Croatian electricity rates.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind v4** (via `@tailwindcss/vite` plugin)
- **shadcn/ui** — New York style, Zinc theme
- **Leaflet** — interactive map for location picking
- **Recharts** — monthly production charts
- **Vercel** — deployment + one serverless function proxying PVGIS

## Getting started

```bash
npm install
npm run dev
```

## Deployment

Deploy to Vercel. The `/api/pvgis.ts` serverless function proxies requests to the PVGIS API (required because PVGIS blocks browser CORS requests).

## Project structure

```
src/
  lib/
    constants.ts     # All financial rates and constants
    hooks/
      usePVGIS.ts    # Fetches & caches PVGIS production data
      useCalculator.ts # Pure arithmetic — derives financials from annualKwh
  components/        # UI components (shadcn/ui + custom)
api/
  pvgis.ts           # Vercel serverless PVGIS proxy
```

## How the model works

1. User picks a location on the map and enters system size (kWp)
2. `/api/pvgis` fetches annual yield (kWh/year) from PVGIS PVcalc — already scaled to the specified peak power
3. `useCalculator` derives savings, payback period, and 25-year ROI from the yield and constants in `src/lib/constants.ts`
