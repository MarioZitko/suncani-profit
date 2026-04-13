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
