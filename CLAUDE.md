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

## v2 additions

### ESRI tile proxy
- api/esri-tiles.ts proxies ESRI World Imagery tiles server-side
- Tile URL in frontend: /api/esri-tiles/{z}/{y}/{x} — note order is z/y/x not z/x/y
- ESRI_API_KEY stored in Vercel env var, never client-side

### Panel packing
- Uses @turf/turf for geodesic area and point-in-polygon
- turf uses [lng, lat] order, Leaflet uses [lat, lng] — always convert when passing to turf
- Panel dimensions: 1.134m × 1.762m + 0.02m gap
- Grid packing: bounding box grid → filter by point-in-polygon
- Returns count and systemKwp (count * 0.42)

### Recommendation engine
- src/lib/recommend.ts — pure math, no external calls
- Inputs: annualKwhPerKwp (from PVGIS 1kWp query), roofKwp, monthlyBill
- Outputs: systemKwp, battery, reasoning[], paybackYears, annualSavings
- Battery recommended if payback difference < 3 years
- All reasoning text in Croatian

### Map modes
- mode='city': CartoDB tiles + city markers (v1 behaviour)
- mode='satellite': ESRI tiles + GeomanControls for polygon drawing + AddressSearch
- MapMode state lives in App.tsx, passed to Map as prop
- When switching to city mode, keep existing polygon — don't delete it

### Address search
- OpenStreetMapProvider from leaflet-geosearch, countrycodes=hr
- Fires map.flyTo on result, zoom 19, duration 1.5s
- Only active in satellite mode
- Do NOT add address search in city mode — it would conflict with city selection

### Coordinate order
- Leaflet: [lat, lng]
- Turf: [lng, lat]
- PVGIS API: lat=, lon= (separate params)
- Never mix these up — it causes silent wrong results

### usePVGISPerKwp
- Always use peakpower=1 for recommendation engine input
- Multiply by recommended kWp client-side
- Avoids extra PVGIS calls when kWp changes

### monthlyBill
- Feeds recommendation engine only
- Does NOT feed into the main financial model

### GeomanControls
- Must be inside FeatureGroup inside MapContainer for edit mode to work
- Polygon only, amber color (#f59e0b), edit enabled
- continueDrawing: false

### leaflet-geosearch
- Must import leaflet-geosearch/dist/geosearch.css or search bar will be unstyled
