import {
	Area,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ReferenceLine,
	ResponsiveContainer,
	ComposedChart,
} from "recharts";
import type { YearDataPoint } from "@/types";

interface Props {
	yearData: YearDataPoint[];
	dark: boolean;
}

const fmt = (v: number) =>
	new Intl.NumberFormat("hr-HR", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	}).format(v);

export default function SavingsChart({ yearData, dark }: Props) {
	const breakEven = yearData.find((d) => d.cumSavings >= d.investment);
	const gridColor = dark ? "#444" : "#ddd";
	const yAxisColor = dark ? "#aaa" : "#666";

	return (
		<div>
			<p className="text-sm font-semibold mb-2">
				Kumulativna ušteda — 25 godina
			</p>
			<ResponsiveContainer width="100%" height={240}>
				<ComposedChart
					data={yearData}
					margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
				>
					<defs>
						<linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
							<stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
					<XAxis
						dataKey="year"
						tickFormatter={(v) => "G" + v}
						fontSize={11}
						tick={{ fill: yAxisColor }}
					/>
					<YAxis
						tickFormatter={(v) => Math.round(v / 1000) + "k€"}
						fontSize={11}
						tick={{ fill: yAxisColor }}
					/>
					<Tooltip
						formatter={(value: number, name: string) => [
							fmt(value),
							name === "cumSavings" ? "Kumulativna ušteda" : "Investicija",
						]}
						labelFormatter={(label) => `Godina ${label}`}
						contentStyle={{
							background: dark ? "#1f2937" : "#fff",
							border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
							color: dark ? "#f9fafb" : "#111827",
							fontSize: 12,
						}}
					/>
					<Legend
						formatter={(value) =>
							value === "cumSavings" ? "Kumulativna ušteda" : "Investicija"
						}
					/>
					<Area
						type="monotone"
						dataKey="cumSavings"
						stroke="#f59e0b"
						strokeWidth={2}
						fill="url(#savingsGradient)"
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="investment"
						stroke={dark ? "#555" : "#ccc"}
						strokeWidth={2}
						strokeDasharray="5 5"
						dot={false}
					/>
					{breakEven && (
						<ReferenceLine
							x={breakEven.year}
							stroke="#22c55e"
							strokeDasharray="4 4"
							label={{
								value: `Break-even G${breakEven.year}`,
								position: "top",
								fontSize: 11,
								fill: "#22c55e",
							}}
						/>
					)}
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}
