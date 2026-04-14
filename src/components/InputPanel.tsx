import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { SELF_CONSUMPTION_RATE } from "@/lib/constants";
import { BatterySize, City, Orientation } from "@/types";
import CitySelector from "@/components/CitySelector";

interface InputPanelProps {
  selectedCity: City;
  onCityChange: (city: City) => void;
  systemKwp: number;
  onSystemKwpChange: (v: number) => void;
  orientation: Orientation;
  onOrientationChange: (o: Orientation) => void;
  battery: BatterySize;
  onBatteryChange: (b: BatterySize) => void;
  tiltAngle: number;
  onTiltAngleChange: (v: number) => void;
  monthlyBill: number;
  onMonthlyBillChange: (v: number) => void;
}

const BATTERY_LABELS: Record<BatterySize, string> = {
  none: "Bez baterije",
  "5kWh": "5 kWh",
  "10kWh": "10 kWh",
};

const BATTERY_OPTIONS: BatterySize[] = ["none", "5kWh", "10kWh"];
const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: "south", label: "⬆ Jug" },
  { value: "east-west", label: "↔ Istok / Zapad" },
];

const activeClass = "bg-primary text-primary-foreground";
const inactiveClass =
  "bg-background border border-input hover:bg-muted text-foreground";

export default function InputPanel({
  selectedCity,
  onCityChange,
  systemKwp,
  onSystemKwpChange,
  orientation,
  onOrientationChange,
  battery,
  onBatteryChange,
  tiltAngle,
  onTiltAngleChange,
  monthlyBill,
  onMonthlyBillChange,
}: InputPanelProps) {
  const selfConsumptionPct = Math.round(SELF_CONSUMPTION_RATE[battery] * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konfiguracija sustava</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 1. City */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Grad</label>
          <CitySelector selectedCity={selectedCity} onChange={onCityChange} />
        </div>

        {/* 2. System size */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Snaga sustava</label>
          <div className="flex items-center gap-3">
            <Slider
              min={2}
              max={20}
              step={0.5}
              value={[systemKwp]}
              onValueChange={([v]) => onSystemKwpChange(v)}
              className="flex-1"
            />
            <div className="flex items-center gap-1 w-24 shrink-0">
              <input
                type="number"
                min={2}
                max={20}
                step={0.5}
                value={systemKwp}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) onSystemKwpChange(Math.min(20, Math.max(2, v)));
                }}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">kWp</span>
            </div>
          </div>
        </div>

        {/* 3. Orientation */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Orijentacija</label>
          <div className="flex gap-2">
            {ORIENTATION_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onOrientationChange(value)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  orientation === value ? activeClass : inactiveClass
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Tilt angle */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nagib krova</label>
          <div className="flex items-center gap-3">
            <Slider
              min={10}
              max={60}
              step={5}
              value={[tiltAngle]}
              onValueChange={([v]) => onTiltAngleChange(v)}
              className="flex-1"
            />
            <div className="flex items-center gap-1 w-16 shrink-0 justify-end">
              <span className="text-sm font-medium">{tiltAngle}</span>
              <span className="text-sm text-muted-foreground">°</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            10° = ravni krov · 35° = optimalno · 60° = strmi krov
          </p>
        </div>

        {/* 5. Battery */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Baterija</label>
          <div className="flex gap-2">
            {BATTERY_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onBatteryChange(size)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  battery === size ? activeClass : inactiveClass
                }`}
              >
                {BATTERY_LABELS[size]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Vlastita potrošnja: {selfConsumptionPct}% proizvedene energije
          </p>
        </div>

        {/* 6. Monthly bill */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Prosječni mjesečni račun</label>
          <div className="flex items-center gap-3">
            <Slider
              min={10}
              max={500}
              step={5}
              value={[monthlyBill]}
              onValueChange={([v]) => onMonthlyBillChange(v)}
              className="flex-1"
            />
            <div className="flex items-center gap-1 w-24 shrink-0">
              <input
                type="number"
                min={10}
                max={500}
                step={5}
                value={monthlyBill}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) onMonthlyBillChange(Math.min(500, Math.max(10, v)));
                }}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Koristi se samo za automatsku preporuku sustava.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
