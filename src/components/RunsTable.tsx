import { Link } from "react-router-dom";
import { formatDate, formatDuration, repoName, statusLabel } from "../lib/format";
import type { ManifestRun } from "../types";

export function RunsTable({ runs }: { runs: ManifestRun[] }) {
  if (!runs.length) return <p className="empty">No runs in this period.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>App</th>
            <th>Suite</th>
            <th>Branch / PR</th>
            <th>Commit</th>
            <th>Result</th>
            <th>Duration</th>
            <th>Report</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="clickable">
              <td>
                <Link className="linkish" to={`/run/${run.id}`}>{formatDate(run.started_at)}</Link>
              </td>
              <td>{repoName(run.repo)}</td>
              <td>{run.suite}</td>
              <td>
                {run.branch || "—"}
                {run.pr ? ` · PR #${run.pr}` : ""}
              </td>
              <td><code>{run.commit || "—"}</code></td>
              <td>
                <span className={`pill ${run.status}`}>
                  <span className="dot" />
                  {statusLabel(run.status)}
                </span>
              </td>
              <td>{formatDuration(run.duration_ms)}</td>
              <td>
                {run.github_run_url ? (
                  <a className="linkish" href={run.github_run_url} target="_blank" rel="noreferrer">
                    CI run
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
