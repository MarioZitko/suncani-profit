import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  BatterySize,
  CalculationResult,
  City,
  Orientation,
  PanelLayout,
  Recommendation,
} from "@/types";
import {
  HEP_TARIFF,
  EXPORT_RATE,
  SYSTEM_COST_PER_KWP,
  BATTERY_COST,
  CO2_FACTOR,
} from "@/lib/constants";

// jsPDF built-in Helvetica covers Windows-1252 only.
// Croatian diacritics (č ć š đ ž) and Unicode minus (U+2212) fall outside that
// range, causing garbled output. We transliterate all non-ASCII chars for PDF.
function toAscii(s: string): string {
  return s
    .replace(/[čć]/g, "c")
    .replace(/[ČĆ]/g, "C")
    .replace(/š/g, "s")
    .replace(/Š/g, "S")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/ž/g, "z")
    .replace(/Ž/g, "Z")
    .replace(/−/g, "-")   // Unicode minus → ASCII hyphen
    .replace(/ /g, " ")   // NBSP → space
    .replace(/ /g, " ");  // Narrow NBSP → space
}

// ASCII-safe EUR formatter — avoids locale-specific Unicode chars that
// Helvetica cannot render (narrow no-break space thousands sep, U+2212 minus).
function pdfEur(n: number): string {
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${s} EUR`;
}

const ORIENTATION_LABELS: Record<Orientation, string> = {
  south: "Jug",
  "east-west": "Istok-Zapad",
};

const BATTERY_LABELS: Record<BatterySize, string> = {
  none: "Bez baterije",
  "5kWh": "Baterija 5 kWh",
  "10kWh": "Baterija 10 kWh",
};

// Typed as mutable tuples — jsPDF Color type requires [number, number, number].
const AMBER: [number, number, number] = [245, 158, 11];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const GRAY: [number, number, number] = [100, 100, 100];
const DARK: [number, number, number] = [30, 30, 30];
const HEADER_DARK: [number, number, number] = [55, 65, 81];
const WHITE: [number, number, number] = [255, 255, 255];

type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } };

function finalY(doc: jsPDF): number {
  return (doc as DocWithTable).lastAutoTable.finalY;
}

export interface ReportParams {
  city: City;
  systemKwp: number;
  orientation: Orientation;
  battery: BatterySize;
  tiltAngle: number;
  monthlyBill: number;
  result: CalculationResult;
  layout: PanelLayout | null;
  recommendation: Recommendation | null;
}

export function generateReport(params: ReportParams): void {
  const {
    city,
    systemKwp,
    orientation,
    battery,
    tiltAngle,
    monthlyBill,
    result,
    layout,
    recommendation,
  } = params;

  const { annualKwh, annualConsumption, overcapacity, annualSavings, totalCost, paybackYears, roi25, co2Avoided, yearData } = result;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  let y = 18;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...AMBER);
  doc.text("Suncani Profit", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  y += 6;
  doc.text("Kalkulator povrata investicije za solarne panele", 14, y);
  y += 5;
  doc.text(
    `Generirano: ${new Date().toLocaleDateString("hr-HR")}   |   Lokacija: ${toAscii(city.name)}, ${toAscii(city.county)}`,
    14,
    y
  );

  y += 4;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y);
  y += 6;

  // ── System Parameters ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Parametri sustava", 14, y);
  y += 4;

  const paramRows: [string, string][] = [
    ["Snaga sustava", `${systemKwp.toFixed(2)} kWp`],
    ["Orijentacija", ORIENTATION_LABELS[orientation]],
    ["Nagib panela", `${tiltAngle}\xB0`],
    ["Pohrana energije", toAscii(BATTERY_LABELS[battery])],
    ["Prosjecni mjescni racun", pdfEur(monthlyBill)],
  ];
  if (layout) {
    paramRows.push(["Broj panela (krov)", `${layout.count} panela`]);
    paramRows.push(["Kapacitet krova", `${layout.systemKwp.toFixed(2)} kWp`]);
  }

  autoTable(doc, {
    startY: y,
    head: [],
    body: paramRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "normal", textColor: GRAY, cellWidth: 65 },
      1: { fontStyle: "bold", textColor: DARK },
    },
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 8;

  // ── Production vs Consumption (2026 net-billing analysis) ────────────────────
  if (annualConsumption > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text("Analiza dimenzioniranja sustava (propisi 2026.)", 14, y);
    y += 4;

    const coveragePct = Math.round((annualKwh / annualConsumption) * 100);
    const statusColor: [number, number, number] = overcapacity ? [234, 88, 12] : GREEN;

    autoTable(doc, {
      startY: y,
      head: [],
      body: [
        ["Procjena godisnje potrosnje", `${Math.round(annualConsumption)} kWh`, "(iz mjescnog racuna)"],
        ["Godisnja proizvodnja sustava", `${Math.round(annualKwh)} kWh`, `${coveragePct}% potrosnje`],
        ["Status dimenzioniranja", overcapacity ? "PREKAPACITIRAN" : "Optimalno", overcapacity ? "Visak ide po nizoj tarifi!" : "Visak minimalan"],
      ] as [string, string, string][],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { textColor: GRAY, cellWidth: 75 },
        1: { fontStyle: "bold", textColor: DARK, cellWidth: 35 },
        2: { textColor: GRAY },
      },
      didParseCell(data) {
        if (data.section === "body" && data.row.index === 2 && data.column.index === 1) {
          data.cell.styles.textColor = statusColor;
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = finalY(doc) + 3;

    if (overcapacity) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(234, 88, 12);
      doc.text(
        toAscii(
          "UPOZORENJE: Prema propisima HEP-a za 2026. (net billing), godisnji visak elektricne energije " +
          "isporucen u mrezu obracunava se samo po tarifi izvoza (7 c/kWh), a ne po tarifi potrosnje (12 c/kWh). " +
          "Preporucuje se smanjiti snagu sustava da godisnja proizvodnja ne premasi potrosnju."
        ),
        14,
        y,
        { maxWidth: W - 28 }
      );
      y += 14;
    } else {
      y += 4;
    }
  }

  // ── Key Results ───────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Rezultati izracuna", 14, y);
  y += 4;

  const paybackStr = paybackYears === Infinity ? "—" : `${paybackYears.toFixed(1)} god`;

  autoTable(doc, {
    startY: y,
    head: [["Pokazatelj", "Vrijednost", "Pokazatelj", "Vrijednost"]],
    body: [
      ["Godisnja ustedba", pdfEur(annualSavings), "Povrat investicije", paybackStr],
      ["Godisnja proizvodnja", `${Math.round(annualKwh)} kWh`, "Ukupna investicija", pdfEur(totalCost)],
      ["ROI (25 godina)", `${roi25.toFixed(0)}%`, "Izbjegnuti CO2/god", `${Math.round(co2Avoided)} kg`],
    ],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: AMBER, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
    columnStyles: {
      0: { textColor: GRAY },
      1: { fontStyle: "bold", textColor: GREEN },
      2: { textColor: GRAY },
      3: { fontStyle: "bold", textColor: GREEN },
    },
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 8;

  // ── Cost Breakdown ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Struktura investicije i tarife", 14, y);
  y += 4;

  const panelCost = systemKwp * SYSTEM_COST_PER_KWP;
  const batCost = BATTERY_COST[battery];

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ["Paneli + inverter + instalacija", pdfEur(panelCost), `${systemKwp.toFixed(2)} kWp x ${SYSTEM_COST_PER_KWP} EUR/kWp`],
      ["Baterija", pdfEur(batCost), toAscii(BATTERY_LABELS[battery])],
      ["Tarifa HEP (vlastita potrosnja)", `${(HEP_TARIFF * 100).toFixed(0)} c/kWh`, "2026"],
      ["Tarifa izvoza (visak)", `${(EXPORT_RATE * 100).toFixed(0)} c/kWh`, "Obracunska cijena"],
      ["CO2 faktor (HR mreza)", `${(CO2_FACTOR * 1000).toFixed(0)} g/kWh`, "Emisijski faktor"],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { textColor: GRAY, cellWidth: 85 },
      1: { fontStyle: "bold", textColor: DARK, cellWidth: 30 },
      2: { textColor: GRAY },
    },
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 8;

  // ── Break-even Analysis ───────────────────────────────────────────────────────
  const breakEvenPoint = yearData.find((d) => d.year > 0 && d.cumSavings >= d.investment);
  const breakEvenYear = breakEvenPoint?.year ?? null;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Break-even analiza", 14, y);
  y += 4;

  const breakEvenRows: [string, string][] = breakEvenYear
    ? [
        ["Break-even (godina)", `Godina ${breakEvenYear}`],
        ["Investicija pokrivena", `${((breakEvenPoint!.cumSavings / totalCost) * 100).toFixed(0)}% u godini ${breakEvenYear}`],
        ["Zarada nakon 25 god.", pdfEur((yearData[25]?.cumSavings ?? 0) - totalCost)],
      ]
    : [["Break-even", "Nije dostizno u 25 godina"]];

  autoTable(doc, {
    startY: y,
    head: [],
    body: breakEvenRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { textColor: GRAY, cellWidth: 65 },
      1: { fontStyle: "bold", textColor: breakEvenYear ? GREEN : RED },
    },
    margin: { left: 14, right: 14 },
  });
  y = finalY(doc) + 3;

  // Croatian 2026 net-billing note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    toAscii(
      "Napomena: Od 2026. u RH vrijedi net billing — godisnji visak se prodaje po nizoj tarifi izvoza (7 c/kWh). " +
      "Izracun uzima u obzir ovo ogranicenje."
    ),
    14,
    y,
    { maxWidth: W - 28 }
  );
  y += 10;

  // ── Recommendation (if available) ─────────────────────────────────────────────
  if (recommendation) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text("Preporuka sustava", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [],
      body: [
        ["Preporuceni sustav", `${recommendation.systemKwp.toFixed(2)} kWp`],
        ["Pohrana energije", toAscii(BATTERY_LABELS[recommendation.battery])],
        ["Godisnja ustedba", pdfEur(recommendation.annualSavings)],
        ["Povrat investicije", `${recommendation.paybackYears.toFixed(1)} god`],
      ] as [string, string][],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { textColor: GRAY, cellWidth: 65 },
        1: { fontStyle: "bold", textColor: DARK },
      },
      margin: { left: 14, right: 14 },
    });
    y = finalY(doc) + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    for (const line of recommendation.reasoning) {
      doc.text(toAscii(`· ${line}`), 18, y);
      y += 4;
    }
    y += 4;
  }

  // ── 25-year Projection ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Projekcija stednje (odabrane godine)", 14, y);
  y += 4;

  const selectedYears = [1, 3, 5, 7, 10, 12, 15, 18, 20, 25];
  const projRows = yearData
    .filter((d) => selectedYears.includes(d.year))
    .map((d) => {
      const net = d.cumSavings - d.investment;
      const netStr = net >= 0 ? `+${pdfEur(net)}` : pdfEur(net);
      return [String(d.year), pdfEur(d.cumSavings), pdfEur(d.investment), netStr];
    });

  autoTable(doc, {
    startY: y,
    head: [["Godina", "Kum. ustedba", "Investicija", "Neto"]],
    body: projRows,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3, halign: "right" },
    headStyles: { fillColor: HEADER_DARK, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
    columnStyles: {
      0: { halign: "center", cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
    // Color neto column per sign — handled entirely here, no columnStyles override.
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const val = String(data.cell.raw ?? "");
        if (val.startsWith("-")) {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ── Footer / Disclaimer ───────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    toAscii(
      "Podaci o suncevu zracenju: PVGIS (European Commission JRC) · Cijene struje: HEP 2026 · " +
      "Izracun je procjena. Stvarne ustedbe ovise o tarifi, potrosnji i instaliranom sustavu. " +
      "Uvijek konzultirajte certificiranog instalatera."
    ),
    14,
    pageH - 8,
    { maxWidth: W - 28 }
  );

  const filename = `suncani-profit-${toAscii(city.name).toLowerCase().replace(/\s+/g, "-")}-${systemKwp}kwp.pdf`;
  doc.save(filename);
}
