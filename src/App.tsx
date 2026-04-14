import { useState } from "react";
import { cities } from "@/data/cities";
import { BatterySize, City, Orientation } from "@/types";
import { useDarkMode } from "@/hooks/useDarkMode";
import { usePVGIS } from "@/hooks/usePVGIS";
import { useCalculator } from "@/hooks/useCalculator";
import Map from "@/components/Map";
import SavingsChart from "@/components/SavingsChart";
import InputPanel from "@/components/InputPanel";
import { ResultCard } from "@/components/ResultCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

export default function App() {
  const [selectedCity, setSelectedCity] = useState<City>(cities[0]);
  const [systemKwp, setSystemKwp] = useState(6);
  const [orientation, setOrientation] = useState<Orientation>("south");
  const [battery, setBattery] = useState<BatterySize>("none");
  const [tiltAngle, setTiltAngle] = useState(35);

  const { dark, toggle } = useDarkMode();
  const { annualKwh, loading, error } = usePVGIS({ city: selectedCity, systemKwp, orientation, tiltAngle });
  const result = useCalculator({ annualKwh: annualKwh ?? 0, systemKwp, battery, tiltAngle });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Sunčani Profit</h1>
            <p className="text-xs text-muted-foreground">Kalkulator povrata investicije za solarne panele</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Podaci za 2026.</Badge>
            <ThemeToggle dark={dark} onToggle={toggle} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border h-64 sm:h-72">
              <Map selectedCity={selectedCity} onCitySelect={setSelectedCity} dark={dark} />
            </div>
            <SavingsChart yearData={result.yearData} dark={dark} />
          </div>
          <div className="space-y-4">
            <InputPanel
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
              systemKwp={systemKwp}
              onSystemKwpChange={setSystemKwp}
              orientation={orientation}
              onOrientationChange={setOrientation}
              battery={battery}
              onBatteryChange={setBattery}
              tiltAngle={tiltAngle}
              onTiltAngleChange={setTiltAngle}
            />
            <ResultCard result={result} loading={loading} />
          </div>
        </div>
      </main>

      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Podaci o sunčevom zračenju: PVGIS (European Commission JRC) · Cijene struje: HEP 2026 · Izračun je informativan. Uvijek konzultirajte certificiranog instalatera.
          </p>
        </div>
      </footer>
    </div>
  );
}
