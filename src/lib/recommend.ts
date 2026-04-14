import {
  HEP_TARIFF,
  EXPORT_RATE,
  SYSTEM_COST_PER_KWP,
  BATTERY_COST,
  SELF_CONSUMPTION_RATE,
  COVERAGE_TARGET,
} from "./constants";
import type { BatterySize, Recommendation } from "../types";

export interface RecommendInput {
  annualKwhPerKwp: number; // from PVGIS 1kWp query
  roofKwp: number;         // from panel packing
  monthlyBill: number;     // EUR/month
}

type BatteryOption = BatterySize;

function calcOption(
  annualKwhPerKwp: number,
  systemKwp: number,
  battery: BatteryOption
): { paybackYears: number; annualSavings: number } {
  const annualProduction = annualKwhPerKwp * systemKwp;
  const selfConsumed = annualProduction * SELF_CONSUMPTION_RATE[battery];
  const exported = annualProduction - selfConsumed;
  const annualSavings = selfConsumed * HEP_TARIFF + exported * EXPORT_RATE;
  const totalCost = systemKwp * SYSTEM_COST_PER_KWP + BATTERY_COST[battery];
  const paybackYears = annualSavings > 0 ? totalCost / annualSavings : Infinity;
  return { paybackYears, annualSavings };
}

export function recommend(input: RecommendInput): Recommendation {
  const { annualKwhPerKwp, roofKwp, monthlyBill } = input;
  const reasoning: string[] = [];

  const annualConsumption = (monthlyBill * 12) / HEP_TARIFF;

  // Target COVERAGE_TARGET of annual consumption, then clamp to what the roof can fit
  const targetKwh = annualConsumption * COVERAGE_TARGET;
  const idealKwp = annualKwhPerKwp > 0 ? targetKwh / annualKwhPerKwp : 0;
  const systemKwp = Math.min(idealKwp, roofKwp);

  reasoning.push(
    `Procijenjena godišnja potrošnja na temelju računa: ${annualConsumption.toFixed(0)} kWh.`
  );

  if (idealKwp > roofKwp) {
    reasoning.push(
      `Idealni sustav za pokrivanje 80% potrošnje bio bi ${idealKwp.toFixed(2)} kWp, ali je ograničen kapacitetom krova na ${roofKwp.toFixed(2)} kWp.`
    );
  } else {
    reasoning.push(
      `Preporučeni sustav od ${systemKwp.toFixed(2)} kWp pokriva ~80% godišnje potrošnje.`
    );
  }

  const annualProduction = annualKwhPerKwp * systemKwp;
  reasoning.push(
    `Procijenjena godišnja proizvodnja: ${annualProduction.toFixed(0)} kWh za sustav od ${systemKwp.toFixed(2)} kWp.`
  );

  const noBattery = calcOption(annualKwhPerKwp, systemKwp, "none");
  const with5kWh = calcOption(annualKwhPerKwp, systemKwp, "5kWh");
  const with10kWh = calcOption(annualKwhPerKwp, systemKwp, "10kWh");

  const diff5 = with5kWh.paybackYears - noBattery.paybackYears;
  const diff10 = with10kWh.paybackYears - noBattery.paybackYears;

  // Prefer larger battery when both are within the 3-year threshold
  let battery: BatteryOption = "none";

  if (diff10 < 3) {
    battery = "10kWh";
    reasoning.push(
      `Preporučuje se baterija 10 kWh — povrat investicije produžen za svega ${diff10.toFixed(1)} god. (prag: 3 god.).`
    );
  } else if (diff5 < 3) {
    battery = "5kWh";
    reasoning.push(
      `Preporučuje se baterija 5 kWh — povrat investicije produžen za svega ${diff5.toFixed(1)} god. (prag: 3 god.).`
    );
  } else {
    reasoning.push(
      `Baterija se ne preporučuje — dodala bi više od 3 godine povratu investicije (5 kWh: +${diff5.toFixed(1)} god., 10 kWh: +${diff10.toFixed(1)} god.).`
    );
  }

  const chosen =
    battery === "10kWh" ? with10kWh : battery === "5kWh" ? with5kWh : noBattery;

  reasoning.push(
    `Ukupni povrat investicije: ${chosen.paybackYears.toFixed(1)} god., godišnja ušteda: ${chosen.annualSavings.toFixed(0)} EUR.`
  );

  return {
    systemKwp,
    battery,
    reasoning,
    paybackYears: chosen.paybackYears,
    annualSavings: chosen.annualSavings,
  };
}
