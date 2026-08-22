export function SeedToggle({
  seedCount,
  includeSeed,
  onChange,
}: {
  seedCount: number;
  includeSeed: boolean;
  onChange: (value: boolean) => void;
}) {
  if (!seedCount) return null;
  return (
    <label className="seed-toggle">
      <input type="checkbox" checked={includeSeed} onChange={(event) => onChange(event.target.checked)} />
      Show {seedCount} sample run{seedCount === 1 ? "" : "s"}
    </label>
  );
}
