import type { PanelLayout } from "@/types";
import { Separator } from "@/components/ui/separator";

interface RoofStatsProps {
  layout: PanelLayout | null;
}

export default function RoofStats({ layout }: RoofStatsProps) {
  if (!layout) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
        Nacrtajte poligon krova u satelitskom prikazu za analizu kapaciteta.
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Analiza krova
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Broj panela
          </p>
          <p className="text-3xl font-bold">{layout.count}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Kapacitet
          </p>
          <p className="text-3xl font-bold">{layout.systemKwp.toFixed(2)} kWp</p>
        </div>
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground">
        Dimenzije panela: 1,134 × 1,762 m · Snaga po panelu: 0,42 kWp
      </p>
    </div>
  );
}
