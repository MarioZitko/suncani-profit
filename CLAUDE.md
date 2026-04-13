# Sunčani Profit

## Stack

React 18, TypeScript, Vite, Tailwind v4, shadcn/ui (New York, Zinc), Leaflet, Recharts.
One Vercel serverless function at /api/pvgis.ts proxies PVGIS API (CORS blocked from browser).

## Key architecture decisions

- PVGIS returns E_y in kWh/year for the specified peakpower. Do NOT multiply by peakpower again.
- usePVGIS caches results in module-level Map — no re-fetch on same city+kWp+orientation combo.
- Map animation: use MapController child component with useMap() + map.flyTo(). Never call flyTo outside MapContainer.
- useCalculator is pure arithmetic — no async, no side effects. Derives everything from annualKwh.
- All financial constants are in src/lib/constants.ts. Never hardcode rates inline.
- monthlyBill input is informational only for UX — it does not feed into the financial model.
  The model uses PVGIS production + constants, not bill-derived consumption.

## Do not

- Do not call PVGIS from the frontend directly — CORS is blocked.
- Do not create tailwind.config.js — Tailwind v4 uses @tailwindcss/vite plugin.
- Do not add a database or auth system.
- Do not multiply E_y by peakpower (PVGIS PVcalc already accounts for it).
