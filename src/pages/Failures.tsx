import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RangeToggle } from "../components/RangeToggle";
import { formatDate, repoName } from "../lib/format";
import { loadRun } from "../lib/load";
import { useRuns } from "../lib/runs";
import { filterByRange } from "../lib/stats";
import type { FailedStep, NormalizedRun, RangeKey } from "../types";

interface GroupedFailure {
  key: string;
  message: string;
  count: number;
  lastSeen: string;
  repos: Set<string>;
  runs: { id: string; repo: string; suite: string; started_at: string; step?: FailedStep }[];
}

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, " ").replace(/\d{4,}ms/g, "Nms").slice(0, 220);
}

export function FailuresPage() {
  const { runs: live } = useRuns();
  const [details, setDetails] = useState<NormalizedRun[]>([]);
  const [range, setRange] = useState<RangeKey>("90");

  useEffect(() => {
    const failed = live.filter((run) => run.status === "failed" || (run.cases_failed || 0) > 0);
    Promise.all(failed.map((run) => loadRun(run.id).catch(() => null))).then((loaded) => {
      setDetails(loaded.filter((run): run is NormalizedRun => Boolean(run)));
    });
  }, [live]);

  const visibleIds = useMemo(() => new Set(filterByRange(live, range).map((run) => run.id)), [live, range]);
  const groups = useMemo(() => {
    const map = new Map<string, GroupedFailure>();
    for (const run of details) {
      if (!visibleIds.has(run.id)) continue;
      const steps = run.failed_steps?.length
        ? run.failed_steps
        : [{ case_id: "", message: "Run failed", step: 0 }];
      for (const step of steps) {
        const key = normalizeMessage(step.message || "Failed");
        const group = map.get(key) || {
          key,
          message: step.message || "Failed",
          count: 0,
          lastSeen: run.started_at,
          repos: new Set<string>(),
          runs: [],
        };
        group.count += 1;
        group.repos.add(run.repo);
        if (Date.parse(run.started_at) > Date.parse(group.lastSeen)) group.lastSeen = run.started_at;
        group.runs.push({ id: run.id, repo: run.repo, suite: run.suite, started_at: run.started_at, step });
        map.set(key, group);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || Date.parse(b.lastSeen) - Date.parse(a.lastSeen));
  }, [details, visibleIds]);

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h2 className="page-title">Failures</h2>
          <p className="page-lead">Repeated problems, grouped by the message testers would recognize.</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>
      {!groups.length && <p className="empty">No failures in this period.</p>}
      {groups.map((group) => (
        <article key={group.key} className="card fail-group">
          <h3>{group.message}</h3>
          <p className="sub">
            Seen {group.count} time{group.count === 1 ? "" : "s"} · last {formatDate(group.lastSeen)} ·{" "}
            {[...group.repos].map(repoName).join(", ")}
          </p>
          <ul className="steps">
            {group.runs.map((item) => (
              <li key={`${item.id}-${item.step?.step || 0}`} className="step">
                <span className="pill failed">{item.suite}</span>
                <div>
                  <Link className="linkish" to={`/run/${item.id}`}>
                    {repoName(item.repo)} · {formatDate(item.started_at)}
                  </Link>
                  {item.step?.case_id ? <div className="muted">Case {item.step.case_id}{item.step.step ? ` · step ${item.step.step}` : ""}</div> : null}
                </div>
                <span className="muted">{item.step?.type || ""}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
