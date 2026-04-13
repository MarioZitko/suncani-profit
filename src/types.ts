export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  county: string;
}

export type Orientation = "south" | "east-west";

export type BatterySize = "none" | "5kWh" | "10kWh";

export interface YearDataPoint {
  year: number;
  cumSavings: number;
  investment: number;
}

export interface CalculationResult {
  annualKwh: number;
  annualSavings: number;
  totalCost: number;
  paybackYears: number;
  roi25: number;
  co2Avoided: number;
  yearData: YearDataPoint[];
}
