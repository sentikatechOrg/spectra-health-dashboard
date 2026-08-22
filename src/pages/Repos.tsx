import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cfg } from "../config";
import { RangeToggle } from "../components/RangeToggle";
import { formatDate, formatDuration, formatPct, healthWord, repoName } from "../lib/format";
import { useRuns } from "../lib/runs";
import { filterByRange, groupByRepo } from "../lib/stats";
import type { ManifestRun, RangeKey } from "../types";

export function ReposPage() {
  const { runs: live } = useRuns();
  const [range, setRange] = useState<RangeKey>("90");
  const navigate = useNavigate();

  const visible = useMemo(() => filterByRange(live, range), [live, range]);
  const groups = useMemo(() => {
    const live = groupByRepo(visible);
    const known = new Set(live.map((group) => group.repo));
    const placeholders = (cfg.connectedRepos || [])
      .filter((repo) => !known.has(repo))
      .map((repo) => ({
        repo,
        runs: [] as ManifestRun[],
        stats: { passRate: 0, runCount: 0, avgDuration: 0, casesPassed: 0, casesFailed: 0, casesSkipped: 0, casesTotal: 0, failedRuns: 0 },
        latest: undefined as ManifestRun | undefined,
        spark: [],
        flaky: false,
        slow: false,
      }));
    return [...live, ...placeholders];
  }, [visible]);

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h2 className="page-title">Apps</h2>
          <p className="page-lead">One card per connected frontend. Green is healthy, amber is flaky, red is failing.</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>
      <section className="repo-grid">
        {groups.map((group) => {
          const health = group.latest ? healthWord(group.stats.passRate) : { label: "No data yet", tone: "watch" as const };
          return (
            <article
              key={group.repo}
              className="card repo-card"
              onClick={() => group.latest && navigate(`/run/${group.latest.id}`)}
            >
              <header>
                <div>
                  <h3>{repoName(group.repo)}</h3>
                  <div className="meta">{group.repo}</div>
                </div>
                <span className={`pill ${health.tone}`}>{health.label}</span>
              </header>
              <div className="repo-stat">
                <div className="label">Pass rate</div>
                <div className="value">{group.stats.runCount ? formatPct(group.stats.passRate) : "—"}</div>
                <div className="hint">
                  {group.latest
                    ? `Latest: ${group.latest.suite} · ${formatDate(group.latest.started_at)} · ${formatDuration(group.latest.duration_ms)}`
                    : "Waiting for the first ingested run"}
                </div>
              </div>
              {group.spark.length > 1 && (
                <div style={{ height: 56, marginTop: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={group.spark}>
                      <Line type="monotone" dataKey="passRate" stroke="#1b8a5a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flags">
                {group.flaky && <span className="pill watch">Flaky suite history</span>}
                {group.slow && <span className="pill watch">Latest run was slow</span>}
                {group.latest?.status === "failed" && <span className="pill bad">Latest run failed</span>}
                {group.latest?.status === "passed" && <span className="pill good">Latest run passed</span>}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
