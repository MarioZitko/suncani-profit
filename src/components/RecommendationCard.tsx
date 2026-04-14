import type { Recommendation } from "@/types";
import { Separator } from "@/components/ui/separator";

const eur = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const BATTERY_LABELS: Record<string, string> = {
  none: "Bez baterije",
  "5kWh": "Baterija 5 kWh",
  "10kWh": "Baterija 10 kWh",
};

interface RecommendationCardProps {
  recommendation: Recommendation | null;
  loading?: boolean;
}

export function RecommendationCard({
  recommendation,
  loading,
}: RecommendationCardProps) {
  if (loading) {
    return (
      <div className="bg-muted rounded-lg h-40 flex items-center justify-center animate-pulse">
        <span className="text-muted-foreground text-sm">
          Računam preporuku…
        </span>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
        Nacrtajte krov i unesite mjesečni račun za automatsku preporuku sustava.
      </div>
    );
  }

  const { systemKwp, battery, paybackYears, annualSavings, reasoning } =
    recommendation;

  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Preporuka sustava
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Godišnja ušteda
          </p>
          <p className="text-3xl font-bold">{eur.format(annualSavings)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Povrat investicije
          </p>
          <p className="text-3xl font-bold">
            {paybackYears === Infinity
              ? "—"
              : `${paybackYears.toFixed(1)} god`}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Preporučeni sustav</p>
          <p className="text-sm font-semibold">{systemKwp.toFixed(2)} kWp</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pohrana energije</p>
          <p className="text-sm font-semibold">{BATTERY_LABELS[battery]}</p>
        </div>
      </div>

      <Separator />

      <ul className="space-y-1">
        {reasoning.map((line, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            · {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
