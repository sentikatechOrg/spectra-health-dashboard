import { Link } from "react-router-dom";
import { cfg } from "../config";
import { formatDate, repoName, statusLabel } from "../lib/format";
import { useRuns } from "../lib/runs";

const actionUrl = `https://github.com/${cfg.org}/${cfg.repo}/actions/workflows/maintain.yml`;

export function MaintainPage() {
  const { runs, error } = useRuns();

  if (error) return <main className="page"><p className="empty">{error}</p></main>;

  return (
    <main className="page">
      <h2 className="page-title">Maintain</h2>
      <p className="page-lead">
        This site is static. Deleting a run has to be a commit on GitHub, not a button in the browser.
        Anyone with write access on <strong>{cfg.org}/{cfg.repo}</strong> can do it — no separate admin login.
      </p>

      <article className="card" style={{ marginBottom: 16 }}>
        <h3>Remove runs</h3>
        <p className="sub">Opens the maintainer workflow. Pages rebuilds after it commits.</p>
        <ol className="steps" style={{ paddingTop: 4 }}>
          <li className="step">
            <span className="pill">1</span>
            <div>
              Open{" "}
              <a className="linkish" href={actionUrl} target="_blank" rel="noreferrer">
                Actions → Maintain dashboard
              </a>
            </div>
          </li>
          <li className="step">
            <span className="pill">2</span>
            <div>
              Click <strong>Run workflow</strong>. Use <code>remove-ids</code> and paste ids from the table.
              <code>purge-seed</code> only deletes leftover demo rows from when the repo was first created — you do not need it for real CI runs.
            </div>
          </li>
        </ol>
        <p className="muted">
          Local equivalent: <code>node scripts/remove-runs.mjs --seed</code> or{" "}
          <code>node scripts/remove-runs.mjs --ids id1,id2</code>
        </p>
      </article>

      <article className="card">
        <h3>All stored runs</h3>
        <p className="sub">Copy an id to remove one real run. Demo leftovers would be tagged Sample.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>App / suite</th>
                <th>Result</th>
                <th>Source</th>
                <th>Id</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>
                    <Link className="linkish" to={`/run/${run.id}`}>{formatDate(run.started_at)}</Link>
                  </td>
                  <td>{repoName(run.repo)} · {run.suite}</td>
                  <td><span className={`pill ${run.status}`}>{statusLabel(run.status)}</span></td>
                  <td>{run.seed ? <span className="pill watch">Sample</span> : <span className="pill good">Real CI</span>}</td>
                  <td><code>{run.id}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}
