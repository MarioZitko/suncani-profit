import { CalculationResult } from "@/types";
import { Separator } from "@/components/ui/separator";

const eur = new Intl.NumberFormat("hr-HR", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

interface Props {
	result: CalculationResult;
	loading: boolean;
}

export function ResultCard({ result, loading }: Props) {
	if (loading) {
		return (
			<div className="bg-muted rounded-lg h-40 flex items-center justify-center animate-pulse">
				<span className="text-muted-foreground text-sm">
					Dohvaćam podatke o suncu…
				</span>
			</div>
		);
	}

	const {
		annualKwh,
		annualSavings,
		totalCost,
		paybackYears,
		roi25,
		co2Avoided,
		yearData,
	} = result;

	const breakEvenYear =
		yearData.find((d) => d.cumSavings >= d.investment)?.year ?? 0;

	return (
		<div className="bg-muted rounded-lg p-4 space-y-3">
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
						{paybackYears === Infinity ? "—" : `${paybackYears.toFixed(1)} god`}
					</p>
				</div>
			</div>

			<Separator />

			<div className="grid grid-cols-3 gap-2 text-center">
				<div>
					<p className="text-xs text-muted-foreground">Godišnja prod.</p>
					<p className="text-sm font-semibold">{Math.round(annualKwh)} kWh</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground">ROI 25 god.</p>
					<p
						className={`text-sm font-semibold ${roi25 > 0 ? "text-green-600 dark:text-green-400" : ""}`}
					>
						{roi25.toFixed(0)}%
					</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground">CO₂ / god.</p>
					<p className="text-sm font-semibold">{Math.round(co2Avoided)} kg</p>
				</div>
			</div>

			<Separator />

			<p className="text-sm">
				<span>Ukupna investicija: {eur.format(totalCost)}</span>
				{breakEvenYear > 0 && (
					<span className="text-muted-foreground">
						{" "}
						· Break-even: godina {breakEvenYear}
					</span>
				)}
			</p>

			<p className="text-xs text-muted-foreground border-t pt-3">
				Izračun je procjena temeljena na PVGIS podacima i prosječnim tržišnim
				cijenama. Stvarne uštede ovise o tarifi, potrošnji i instaliranom
				sustavu.
			</p>
		</div>
	);
}
