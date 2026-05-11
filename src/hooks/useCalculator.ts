import {
  SELF_CONSUMPTION_RATE,
  SYSTEM_COST_PER_KWP,
  BATTERY_COST,
  HEP_TARIFF,
  EXPORT_RATE,
  PANEL_DEGRADATION,
  ELECTRICITY_INFLATION,
  CO2_FACTOR,
  ALL_IN_TARIFF,
} from "@/lib/constants";
import type { BatterySize, CalculationResult, YearDataPoint } from "@/types";

interface UseCalculatorParams {
  annualKwh: number;
  systemKwp: number;
  battery: BatterySize;
  tiltAngle: number;
  monthlyBill: number;
}

// From 2026, Croatia uses net-billing: surplus annual production is sold at
// the low export rate (EXPORT_RATE) instead of 1:1 offset against consumption.
// Self-consumed kWh is capped at actual consumption — producing more than you
// use in a year doesn't save more; it earns export rate on the excess instead.
function cappedSavings(
  productionKwh: number,
  selfRate: number,
  annualConsumption: number,
  tariffInflation: number
): number {
  const selfRaw = productionKwh * selfRate;
  const selfConsumed = annualConsumption > 0 ? Math.min(selfRaw, annualConsumption) : selfRaw;
  const exported = productionKwh - selfConsumed;
  return (
    selfConsumed * HEP_TARIFF * tariffInflation +
    exported * EXPORT_RATE * tariffInflation
  );
}

export function useCalculator({
  annualKwh,
  systemKwp,
  battery,
  monthlyBill,
}: UseCalculatorParams): CalculationResult {
  const selfRate = SELF_CONSUMPTION_RATE[battery];
  const totalCost = systemKwp * SYSTEM_COST_PER_KWP + BATTERY_COST[battery];

  // Divide the total monthly bill by the all-in price per kWh to get consumption.
  // ALL_IN_TARIFF already includes network, OIE, and VAT — the same components
  // that make up the bill — so the division gives the correct kWh figure directly.
  // monthlyBill = 0 means unknown → no cap applied.
  const annualConsumption =
    monthlyBill > 0 ? (monthlyBill * 12) / ALL_IN_TARIFF : 0;
  const overcapacity = annualConsumption > 0 && annualKwh > annualConsumption;

  const annualSavings = cappedSavings(annualKwh, selfRate, annualConsumption, 1);

  const paybackYears = annualSavings === 0 ? Infinity : totalCost / annualSavings;
  const co2Avoided = annualKwh * CO2_FACTOR;

  const yearData: YearDataPoint[] = [
    { year: 0, cumSavings: 0, investment: totalCost },
  ];

  let cumSavings = 0;
  for (let y = 1; y <= 25; y++) {
    const degradation = Math.pow(1 - PANEL_DEGRADATION, y);
    const inflation = Math.pow(1 + ELECTRICITY_INFLATION, y);
    const degradedProduction = annualKwh * degradation;
    const yearlySavings = cappedSavings(degradedProduction, selfRate, annualConsumption, inflation);
    cumSavings += yearlySavings;
    yearData.push({ year: y, cumSavings, investment: totalCost });
  }

  const roi25 =
    totalCost === 0 ? 0 : ((yearData[25].cumSavings - totalCost) / totalCost) * 100;

  return {
    annualKwh,
    annualConsumption,
    overcapacity,
    annualSavings,
    totalCost,
    paybackYears,
    roi25,
    co2Avoided,
    yearData,
  };
}
