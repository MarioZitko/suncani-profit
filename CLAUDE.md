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
- monthlyBill feeds BOTH the recommendation engine AND the main financial model.
- useCalculator derives annualConsumption = (monthlyBill * 12) / ALL_IN_TARIFF
  and caps self-consumed kWh so it never exceeds actual consumption (2026 Croatian net-billing rule).
- ALL_IN_TARIFF = HEP_TARIFF = 0.176 EUR/kWh: the full all-in household price including
  network/ODS (0.049), transmission (0.011), OIE renewable levy (0.013), energy supply (0.079),
  and 13% VAT. Source: HEP Elektra + HERA 2026.
- Dividing total monthly bill by ALL_IN_TARIFF gives correct kWh because the bill
  is composed of the same per-kWh components — no separate fraction correction needed.
- HEP_TARIFF is also used for savings (avoided cost per self-consumed kWh) — same 0.176
  value because self-consuming solar avoids the full all-in price, not just supply.
- If monthlyBill = 0, no cap is applied (backwards-compatible for zero-bill state).
- recommend.ts uses the same ALL_IN_TARIFF for consistency.
- Croatia switched from net metering (1:1 offset) to net billing on 1 Jan 2026:
  surplus annual production goes to grid at EXPORT_RATE (7c/kWh), not full tariff (12c/kWh).
  Systems sized to produce more than consumed lose money on the excess.
- CalculationResult now includes annualConsumption and overcapacity boolean.

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

## Report generation

### Library
- jsPDF + jspdf-autotable (most popular PDF stack for web apps)
- `src/lib/generateReport.ts` — pure function, no React, no side effects

### Croatian character handling
- jsPDF built-in fonts (Helvetica) only cover Windows-1252 (Latin-1)
- Croatian diacritics (č ć š đ ž) are OUTSIDE that range — they render as boxes
- Workaround: `toAscii()` utility inside generateReport.ts transliterates for PDF text only
- The UI always keeps correct Croatian spelling — only the PDF output is ASCII-safe
- Do NOT add a TTF font embed unless the user explicitly asks for full diacritic support in PDF

### Report structure
1. Header — app name, subtitle, generation date, city
2. Parametri sustava — system kWp, orientation, tilt, battery, monthly bill, roof layout (if drawn)
3. Rezultati izracuna — annual savings, payback, production, cost, ROI 25y, CO2 (2-column table)
4. Struktura investicije i tarife — cost breakdown and tariff constants
5. Preporuka sustava — only shown if recommendation != null (satellite mode + roof drawn)
6. Projekcija stednje — selected years (1,3,5,7,10,12,15,18,20,25) with cumSavings / net
7. Footer disclaimer

### Download trigger
- Button appears in the header when `!loading && result.annualKwh > 0`
- Filename pattern: `suncani-profit-{city}-{kWp}kwp.pdf`
- Passes all current App.tsx state to generateReport() — city, result, layout, recommendation

### jsPDF internals
- `autoTable(doc, opts)` — always use the named import from jspdf-autotable, not doc.autoTable
- `lastAutoTable.finalY` accessed via `(doc as unknown as { lastAutoTable: { finalY: number } })` — needed for cursor positioning between sections
- Colors stored as `readonly [R, G, B]` tuples for spread into jsPDF color setters
