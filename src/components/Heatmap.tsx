import { localDateKey } from "../lib/format";
import { dayHealth } from "../lib/stats";
import type { ManifestRun } from "../types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthsToShow(runs: ManifestRun[]): { year: number; month: number }[] {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  let start = new Date(end);

  if (runs.length) {
    const times = runs.map((run) => Date.parse(run.started_at)).filter((time) => !Number.isNaN(time));
    const earliest = new Date(Math.min(...times));
    const latest = new Date(Math.max(...times, now.getTime()));
    start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    end.setFullYear(latest.getFullYear(), latest.getMonth(), 1);
  }

  const months: { year: number; month: number }[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
  }
  return months;
}

function monthCells(year: number, month: number): Array<number | null> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayFirst = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Array<number | null> = Array.from({ length: mondayFirst }, () => null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function statusLabel(health?: "good" | "bad" | "mixed"): string {
  if (health === "good") return "Passed";
  if (health === "bad") return "Failed";
  if (health === "mixed") return "Mixed";
  return "No run";
}

export function Heatmap({ runs }: { runs: ManifestRun[] }) {
  const health = dayHealth(runs);
  const counts = new Map<string, number>();
  for (const run of runs) {
    const day = localDateKey(run.started_at);
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  return (
    <>
      <div className="calendars">
        {monthsToShow(runs).map(({ year, month }) => {
          const title = new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
          return (
            <section key={`${year}-${month}`} className="month-cal" aria-label={title}>
              <h4>{title}</h4>
              <div className="cal-grid">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="cal-dow">
                    {day}
                  </div>
                ))}
                {monthCells(year, month).map((day, index) => {
                  if (day == null) return <div key={`pad-${index}`} className="cal-cell pad" />;
                  const key = monthKey(year, month, day);
                  const tone = health.get(key);
                  const count = counts.get(key) || 0;
                  return (
                    <div
                      key={key}
                      className={`cal-cell ${tone || "empty"}`}
                      title={`${key}: ${statusLabel(tone)}${count ? ` · ${count} run${count === 1 ? "" : "s"}` : ""}`}
                    >
                      <span className="cal-num">{day}</span>
                      <span className="cal-status">{tone ? statusLabel(tone) : ""}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="heat-legend">
        <span><i className="swatch" style={{ background: "#22a06b" }} /> Passed that day</span>
        <span><i className="swatch" style={{ background: "#d97706" }} /> Mixed (pass and fail)</span>
        <span><i className="swatch" style={{ background: "#c9372c" }} /> Failed that day</span>
        <span><i className="swatch" style={{ background: "#ebecf0" }} /> No test run</span>
      </div>
    </>
  );
}
