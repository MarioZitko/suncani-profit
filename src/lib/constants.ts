// ── HEP tariff structure (2026, source: HEP Elektra + HERA) ─────────────────
//
// A Croatian household electricity bill consists of:
//   Energy supply (opskrba):        0.079 EUR/kWh
//   Distribution/network (ODS):     0.049 EUR/kWh
//   Transmission (prijenos):        0.011 EUR/kWh
//   Renewable levy (OIE):           0.013 EUR/kWh
//   ─────────────────────────────────────────────
//   Subtotal before VAT:            0.152 EUR/kWh
//   VAT (13%):                      0.020 EUR/kWh
//   ─────────────────────────────────────────────
//   ALL-IN price:                  ~0.176 EUR/kWh
//
// When self-consuming solar you avoid the FULL all-in price per kWh.
// HEP_TARIFF is therefore set to the all-in rate, not just the supply component.

// Full all-in household electricity price including network, OIE and VAT (EUR/kWh)
export const HEP_TARIFF = 0.176;

// Feed-in / export rate for surplus energy under 2026 net-billing (EUR/kWh).
// Wholesale reference price — significantly lower than the retail tariff.
export const EXPORT_RATE = 0.07;

// Installed system cost per kWp in EUR (panels + inverter + installation)
export const SYSTEM_COST_PER_KWP = 1200;

// Battery storage cost in EUR per battery size option
export const BATTERY_COST: Record<string, number> = {
  none: 0,
  "5kWh": 3500,
  "10kWh": 6500,
};

// Fraction of produced energy consumed on-site per battery size option
export const SELF_CONSUMPTION_RATE: Record<string, number> = {
  none: 0.30,
  "5kWh": 0.65,
  "10kWh": 0.75,
};

// Annual panel degradation rate (fraction, e.g. 0.005 = 0.5%/year)
export const PANEL_DEGRADATION = 0.005;

// Annual electricity price inflation rate (fraction)
export const ELECTRICITY_INFLATION = 0.03;

// CO2 emission factor for Croatian grid in kg CO2 per kWh
export const CO2_FACTOR = 0.238;

// PVGIS aspect (azimuth) value per orientation
export const ORIENTATION_ASPECT: Record<string, number> = {
  south: 0,
  "east-west": 90,
};

// All-in price per kWh — used to convert a monthly bill (EUR) to kWh consumption.
// Dividing the total bill by this rate gives the actual consumption, because the
// bill already includes all per-kWh components (network, OIE, VAT).
// Same value as HEP_TARIFF; kept as a named constant to make the intent clear.
export const ALL_IN_TARIFF = HEP_TARIFF;

// v2: Panel packing
// Physical panel dimensions in metres
export const PANEL_WIDTH_M = 1.134;
export const PANEL_HEIGHT_M = 1.722;
// Gap between panels in metres
export const PANEL_GAP_M = 0.02;
// Peak power per panel in kWp
export const PANEL_KWP = 0.42;
// Grid cell size in metres (panel + gap on each axis)
export const PANEL_CELL_W = PANEL_WIDTH_M + PANEL_GAP_M; // 1.154m
export const PANEL_CELL_H = PANEL_HEIGHT_M + PANEL_GAP_M; // 1.782m

// v2: Recommendation engine
// Target fraction of annual consumption to cover with solar
export const COVERAGE_TARGET = 0.8;
