// HEP electricity tariff in EUR/kWh (household, higher tariff block)
export const HEP_TARIFF = 0.12;

// Feed-in / export rate for surplus energy in EUR/kWh
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

// v2: Panel packing
// Physical panel dimensions in metres
export const PANEL_WIDTH_M = 1.134;
export const PANEL_HEIGHT_M = 1.762;
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
