import type { MapMode } from "@/types";

interface ModeToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
}

const activeClass = "bg-primary text-primary-foreground";
const inactiveClass =
  "bg-background border border-input hover:bg-muted text-foreground";

const OPTIONS: { value: MapMode; label: string }[] = [
  { value: "city", label: "Gradovi" },
  { value: "satellite", label: "Satelit" },
];

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onModeChange(value)}
          className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            mode === value ? activeClass : inactiveClass
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
