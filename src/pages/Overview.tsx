import { useEffect, useMemo, useState } from "react";
import { FailuresBar } from "../components/FailuresBar";
import { Heatmap } from "../components/Heatmap";
import { RangeToggle } from "../components/RangeToggle";
import { RunsTable } from "../components/RunsTable";
import { StatusDonut } from "../components/StatusDonut";
import { DurationTrend, PassRateTrend } from "../components/TrendCharts";
import { formatDuration, formatPct } from "../lib/format";
import { loadManifest } from "../lib/load";
import { failuresBySuite, filterByRange, openFailures, totals, trendPoints, verdict } from "../lib/stats";
import type { ManifestRun, RangeKey } from "../types";

export function OverviewPage() {
  const [runs, setRuns] = useState<ManifestRun[]>([]);
  const [range, setRange] = useState<RangeKey>("30");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManifest()
      .then((manifest) => setRuns(manifest.runs || []))
      .catch((err: Error) => setError(err.message));
  }, []);

  const visible = useMemo(() => filterByRange(runs, range), [runs, range]);
  const stats = useMemo(() => totals(visible), [visible]);
  const open = useMemo(() => openFailures(visible), [visible]);
  const trend = useMemo(() => trendPoints(visible), [visible]);
  const bars = useMemo(() => failuresBySuite(visible), [visible]);
  const story = useMemo(() => verdict(visible), [visible]);
  const kpiTone = stats.passRate >= 0.9 ? "good" : stats.passRate >= 0.7 ? "watch" : "bad";

  if (error) return <main className="page"><p className="empty">{error}</p></main>;

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="page-lead">Pass rate, speed, and open problems across every connected frontend.</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <section className={`verdict ${story.tone}`}>
        <div>
          <h2>{story.title}</h2>
          <p>{story.detail}</p>
        </div>
      </section>

      <section className="kpis">
        <article className={`kpi ${kpiTone}`}>
          <div className="label">Pass rate</div>
          <div className="value">{formatPct(stats.passRate)}</div>
          <div className="hint">{stats.casesPassed} of {stats.casesTotal} cases passed</div>
        </article>
        <article className="kpi">
          <div className="label">Total runs</div>
          <div className="value">{stats.runCount}</div>
          <div className="hint">In the selected period</div>
        </article>
        <article className="kpi">
          <div className="label">Average duration</div>
          <div className="value">{formatDuration(stats.avgDuration)}</div>
          <div className="hint">How long a typical check takes</div>
        </article>
        <article className={`kpi ${open.length ? "bad" : "good"}`}>
          <div className="label">Open failures</div>
          <div className="value">{open.length}</div>
          <div className="hint">Suites still red on the latest run</div>
        </article>
      </section>

      <section className="grid-2">
        <article className="card">
          <h3>Passed vs failed vs skipped</h3>
          <p className="sub">Share of test cases in this period</p>
          <StatusDonut passed={stats.casesPassed} failed={stats.casesFailed} skipped={stats.casesSkipped} />
        </article>
        <article className="card">
          <h3>Pass rate over time</h3>
          <p className="sub">Are we getting healthier?</p>
          <PassRateTrend data={trend} />
        </article>
        <article className="card">
          <h3>How long checks take</h3>
          <p className="sub">Average minutes per run, by day</p>
          <DurationTrend data={trend} />
        </article>
        <article className="card">
          <h3>Failures by suite</h3>
          <p className="sub">Where the red is concentrated</p>
          <FailuresBar data={bars} />
        </article>
      </section>

      <article className="card" style={{ marginBottom: 12 }}>
        <h3>Daily health</h3>
        <p className="sub">A normal month calendar. Each dated square is one day — Passed, Failed, Mixed, or no run.</p>
        <Heatmap runs={visible} />
      </article>

      <article className="card">
        <h3>Latest runs</h3>
        <p className="sub">Click a row to see which cases and steps failed.</p>
        <RunsTable runs={visible} />
      </article>
    </main>
  );
}
