import type { RangeKey } from "../types";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "all", label: "All history" },
];

export function RangeToggle({ value, onChange }: { value: RangeKey; onChange: (key: RangeKey) => void }) {
  return (
    <div className="range" role="group" aria-label="Time range">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={value === option.key ? "active" : undefined}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
