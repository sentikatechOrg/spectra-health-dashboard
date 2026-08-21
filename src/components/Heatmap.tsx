import { dayHealth } from "../lib/stats";
import type { ManifestRun } from "../types";

function lastWeeks(weeks = 12): string[] {
  const days: string[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - weeks * 7 + 1);
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(cursor.toISOString().slice(0, 10));
  }
  return days;
}

export function Heatmap({ runs }: { runs: ManifestRun[] }) {
  const health = dayHealth(runs);
  const days = lastWeeks(12);
  return (
    <>
      <div className="heatmap" aria-label="Daily health calendar">
        {days.map((day) => (
          <div
            key={day}
            className={`heat-cell ${health.get(day) || ""}`}
            title={`${day}: ${health.get(day) === "good" ? "All passed" : health.get(day) === "bad" ? "Failures" : health.get(day) === "mixed" ? "Mixed" : "No runs"}`}
          />
        ))}
      </div>
      <div className="heat-legend">
        <span><i className="swatch" style={{ background: "#22a06b" }} /> All passed</span>
        <span><i className="swatch" style={{ background: "#d97706" }} /> Mixed</span>
        <span><i className="swatch" style={{ background: "#c9372c" }} /> Failures</span>
        <span><i className="swatch" style={{ background: "#ebecf0" }} /> No run</span>
      </div>
    </>
  );
}
