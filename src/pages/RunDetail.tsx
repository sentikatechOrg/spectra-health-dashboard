import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDate, formatDuration, repoName, statusLabel } from "../lib/format";
import { artifactUrl, loadRun } from "../lib/load";
import type { CaseRecord, NormalizedRun } from "../types";

function CaseBlock({ testCase }: { testCase: CaseRecord }) {
  const [open, setOpen] = useState(testCase.status === "failed");
  return (
    <section className="case">
      <header className="case-head" onClick={() => setOpen((value) => !value)}>
        <div>
          <strong>{testCase.id}</strong> · {testCase.name}
        </div>
        <div>
          <span className={`pill ${testCase.status}`}>{statusLabel(testCase.status)}</span>
          <span className="muted" style={{ marginLeft: 10 }}>{formatDuration(testCase.duration_ms)}</span>
        </div>
      </header>
      {open && (
        <ol className="steps">
          {testCase.steps.map((step) => {
            const shot = artifactUrl(step.artifacts?.screenshot || step.artifacts?.actual || step.artifacts?.state);
            return (
              <li key={step.stepIndex} className={`step ${step.status}`}>
                <span className={`pill ${step.status}`}>{step.stepIndex + 1}</span>
                <div>
                  <div>{step.description || step.type}</div>
                  <div className="muted">{step.type}</div>
                  {step.message && <div className="step-msg">{step.message}</div>}
                  {step.status === "failed" && (
                    <div className="shot">
                      {shot ? (
                        <img
                          src={shot}
                          alt="Failed step"
                          onError={(event) => {
                            const target = event.currentTarget;
                            target.style.display = "none";
                            const fallback = target.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.hidden = false;
                          }}
                        />
                      ) : null}
                      <div className="missing" hidden={Boolean(shot)}>
                        Screenshot was not stored with this dashboard record. Open the CI run for the full HTML report.
                      </div>
                    </div>
                  )}
                </div>
                <span className="muted">{formatDuration(step.duration_ms)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function RunDetailPage() {
  const { id = "" } = useParams();
  const [run, setRun] = useState<NormalizedRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRun(id).then(setRun).catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) return <main className="page"><p className="empty">{error}</p></main>;
  if (!run) return <main className="page"><p className="empty">Loading this run…</p></main>;

  return (
    <main className="page">
      <p><Link className="linkish" to="/">← Back to overview</Link></p>
      <h2 className="page-title">{repoName(run.repo)} · {run.suite}</h2>
      <p className="page-lead">
        {formatDate(run.started_at)} · {run.branch || "unknown branch"}
        {run.pr ? ` · PR #${run.pr}` : ""} · {run.commit || "no commit"}
        {run.commit_owner ? ` · ${run.commit_owner}` : ""}
      </p>

      <section className="kpis">
        <article className={`kpi ${run.status === "passed" ? "good" : "bad"}`}>
          <div className="label">Result</div>
          <div className="value">{statusLabel(run.status)}</div>
          <div className="hint">{Math.round(run.pass_rate * 100)}% of cases passed</div>
        </article>
        <article className="kpi">
          <div className="label">Duration</div>
          <div className="value">{formatDuration(run.duration_ms)}</div>
          <div className="hint">{run.cases_passed} passed · {run.cases_failed} failed</div>
        </article>
        <article className="kpi">
          <div className="label">App</div>
          <div className="value" style={{ fontSize: "1.15rem" }}>{run.repo}</div>
          <div className="hint">{run.suite_file || `${run.suite}.yaml`}</div>
        </article>
        <article className="kpi">
          <div className="label">Links</div>
          <div className="value" style={{ fontSize: "1rem" }}>
            {run.github_run_url ? (
              <a className="linkish" href={run.github_run_url} target="_blank" rel="noreferrer">Open CI run</a>
            ) : (
              "—"
            )}
          </div>
          <div className="hint">{run.html_report ? "HTML report stored" : "Use the CI artifact for the full HTML report"}</div>
        </article>
      </section>

      {(run.cases || []).map((testCase) => (
        <CaseBlock key={testCase.id} testCase={testCase} />
      ))}
    </main>
  );
}
