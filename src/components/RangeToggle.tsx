import type { RangeKey } from "../types";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "all", label: "All history" },
];

export function RangeToggle<T extends string = RangeKey>({
  value,
  onChange,
  options,
  label = "Time range",
}: {
  value: T;
  onChange: (key: T) => void;
  options?: { key: T; label: string }[];
  label?: string;
}) {
  const items = options ?? (OPTIONS as { key: T; label: string }[]);
  return (
    <div className="range" role="group" aria-label={label}>
      {items.map((option) => (
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
