import {
  SELF_CONSUMPTION_RATE,
  SYSTEM_COST_PER_KWP,
  BATTERY_COST,
  HEP_TARIFF,
  EXPORT_RATE,
  PANEL_DEGRADATION,
  ELECTRICITY_INFLATION,
  CO2_FACTOR,
} from "@/lib/constants";
import type { BatterySize, CalculationResult, YearDataPoint } from "@/types";

interface UseCalculatorParams {
  annualKwh: number;
  systemKwp: number;
  battery: BatterySize;
  tiltAngle: number;
}

export function useCalculator({
  annualKwh,
  systemKwp,
  battery,
}: UseCalculatorParams): CalculationResult {
  const selfRate = SELF_CONSUMPTION_RATE[battery];
  const totalCost = systemKwp * SYSTEM_COST_PER_KWP + BATTERY_COST[battery];

  const annualSavings =
    annualKwh * selfRate * HEP_TARIFF +
    annualKwh * (1 - selfRate) * EXPORT_RATE;

  const paybackYears = annualSavings === 0 ? Infinity : totalCost / annualSavings;

  const co2Avoided = annualKwh * CO2_FACTOR;

  // Index 0 = year 0, cumSavings = 0
  const yearData: YearDataPoint[] = [
    { year: 0, cumSavings: 0, investment: totalCost },
  ];

  let cumSavings = 0;
  for (let y = 1; y <= 25; y++) {
    const degradation = Math.pow(1 - PANEL_DEGRADATION, y);
    const inflation = Math.pow(1 + ELECTRICITY_INFLATION, y);
    const yearlySavings =
      annualKwh * degradation * selfRate * HEP_TARIFF * inflation +
      annualKwh * degradation * (1 - selfRate) * EXPORT_RATE * inflation;
    cumSavings += yearlySavings;
    yearData.push({ year: y, cumSavings, investment: totalCost });
  }

  const roi25 =
    totalCost === 0 ? 0 : ((yearData[25].cumSavings - totalCost) / totalCost) * 100;

  return {
    annualKwh,
    annualSavings,
    totalCost,
    paybackYears,
    roi25,
    co2Avoided,
    yearData,
  };
}
