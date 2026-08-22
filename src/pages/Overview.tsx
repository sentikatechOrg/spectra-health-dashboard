import { useMemo, useState } from "react";
import { FailuresBar } from "../components/FailuresBar";
import { Heatmap } from "../components/Heatmap";
import { RangeToggle } from "../components/RangeToggle";
import { RunsTable } from "../components/RunsTable";
import { StatusDonut } from "../components/StatusDonut";
import { DurationTrend, PassRateTrend } from "../components/TrendCharts";
import { formatDuration, formatPct } from "../lib/format";
import { useRuns } from "../lib/runs";
import { failuresBySuite, filterByRange, openFailures, totals, trendPoints, verdict } from "../lib/stats";
import type { RangeKey } from "../types";

export function OverviewPage() {
  const { runs: live, error } = useRuns();
  const [range, setRange] = useState<RangeKey>("30");

  const visible = useMemo(() => filterByRange(live, range), [live, range]);
  const stats = useMemo(() => totals(visible), [visible]);
  const open = useMemo(() => openFailures(visible), [visible]);
  const trend = useMemo(() => trendPoints(visible), [visible]);
  const bars = useMemo(() => failuresBySuite(visible), [visible]);
  const story = useMemo(() => verdict(visible), [visible]);
  const kpiTone = stats.passRate >= 0.9 ? "good" : stats.passRate >= 0.7 ? "watch" : "bad";

  if (error) return <main className="page"><p className="empty">{error}</p></main>;

  return (
    <main className="page page-fit">
      <div className="toolbar tight">
        <p className={`verdict-inline ${story.tone}`}>{story.title} — {story.detail}</p>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <section className="kpis compact">
        <article className={`kpi ${kpiTone}`}>
          <div className="label">Pass rate</div>
          <div className="value">{formatPct(stats.passRate)}</div>
          <div className="hint">{stats.casesPassed} of {stats.casesTotal} cases</div>
        </article>
        <article className="kpi">
          <div className="label">Total runs</div>
          <div className="value">{stats.runCount}</div>
          <div className="hint">This period</div>
        </article>
        <article className="kpi">
          <div className="label">Avg duration</div>
          <div className="value">{formatDuration(stats.avgDuration)}</div>
          <div className="hint">Typical check</div>
        </article>
        <article className={`kpi ${open.length ? "bad" : "good"}`}>
          <div className="label">Open failures</div>
          <div className="value">{open.length}</div>
          <div className="hint">Still red</div>
        </article>
      </section>

      <section className="board">
        <article className="card chart-card">
          <h3>Passed vs failed</h3>
          <div className="chart-fill">
            <StatusDonut passed={stats.casesPassed} failed={stats.casesFailed} skipped={stats.casesSkipped} fill />
          </div>
        </article>
        <article className="card chart-card">
          <h3>Pass rate over time</h3>
          <div className="chart-fill">
            <PassRateTrend data={trend} fill />
          </div>
        </article>
        <article className="card chart-card">
          <h3>How long checks take</h3>
          <div className="chart-fill">
            <DurationTrend data={trend} fill />
          </div>
        </article>
        <article className="card chart-card">
          <h3>Failures by suite</h3>
          <div className="chart-fill">
            <FailuresBar data={bars} fill />
          </div>
        </article>
        <article className="card cal-card">
          <h3>Daily health</h3>
          <Heatmap runs={visible} compact />
        </article>
      </section>

      <article className="card table-card">
        <h3>Latest runs</h3>
        <div className="table-scroll">
          <RunsTable runs={visible} />
        </div>
      </article>
    </main>
  );
}
