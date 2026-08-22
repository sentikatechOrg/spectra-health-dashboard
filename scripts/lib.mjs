import { readFile } from "node:fs/promises";

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

export function slugifyRepo(repo) {
  return String(repo || "unknown").replace(/[^A-Za-z0-9._-]+/g, "-");
}

export function runId({ repo, githubRunId, suite }) {
  const base = `${slugifyRepo(repo)}-${githubRunId || Date.now()}`;
  return suite ? `${base}-${String(suite).replace(/[^A-Za-z0-9._-]+/g, "-")}` : base;
}

export function stripAnsi(text) {
  return String(text || "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\x1b\[[0-9;]*m/g, "")
    .trim();
}

export function firstScreenshot(artifacts = {}) {
  const keys = ["screenshot", "actual", "state", "diff", "baseline"];
  for (const key of keys) {
    if (artifacts[key]) return artifacts[key];
  }
  return undefined;
}

export function failedStepsFromCases(cases = []) {
  const failed = [];
  for (const testCase of cases) {
    const failedStep = (testCase.steps || []).find((step) => step.status === "failed");
    if (failedStep) {
      failed.push({
        case_id: testCase.id,
        case_name: testCase.name,
        step: (failedStep.stepIndex ?? 0) + 1,
        type: failedStep.type,
        selector: failedStep.selector,
        message: stripAnsi(failedStep.message || testCase.error || "Step failed"),
        screenshot: firstScreenshot(failedStep.artifacts),
      });
    } else if (testCase.status === "failed") {
      failed.push({
        case_id: testCase.id,
        case_name: testCase.name,
        step: 0,
        message: stripAnsi(testCase.error || "Case failed"),
      });
    }
  }
  return failed;
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function normalizeReport(report, extras = {}) {
  const total = Number(report.total ?? report.cases?.length ?? 0);
  const passed = Number(report.passed ?? 0);
  const failed = Number(report.failed ?? 0);
  const skipped = Number(report.skipped ?? 0);
  const passRate = total > 0 ? passed / total : failed > 0 ? 0 : 1;
  const status = failed > 0 || report.status === "failed" ? "failed" : "passed";
  const repo = extras.repo || extras.source_repo || "unknown/unknown";
  const [org] = repo.split("/");
  const metadata = report.metadata || {};
  const frontend = metadata.frontend || {};
  const project = metadata.project || {};
  const commit =
    extras.commit ||
    frontend.short_commit ||
    frontend.commit?.slice(0, 7) ||
    project.short_commit ||
    project.commit?.slice(0, 7) ||
    "";
  const branch = extras.branch || frontend.branch || project.branch || "";
  const githubRunId = String(extras.github_run_id || extras.run_id || "");
  const suite = report.suite || extras.suite || "unknown";
  const id = extras.id || runId({ repo, githubRunId, suite });
  const cases = Array.isArray(report.cases) ? report.cases : [];

  return {
    id,
    repo,
    org,
    suite,
    status,
    pass_rate: Number(passRate.toFixed(4)),
    started_at: report.started_at || extras.started_at || new Date().toISOString(),
    finished_at: report.finished_at || extras.finished_at,
    duration_ms: Number(report.duration_ms || 0),
    pr: extras.pr != null && extras.pr !== "" ? Number(extras.pr) : null,
    branch,
    commit,
    github_run_id: githubRunId || undefined,
    github_run_url: extras.github_run_url || extras.workflow_url || undefined,
    workflow_url: extras.workflow_url || extras.github_run_url || undefined,
    ingested_at: extras.ingested_at || new Date().toISOString(),
    html_report: extras.html_report || undefined,
    frontend_commit: frontend.short_commit || frontend.commit,
    frontend_branch: frontend.branch,
    spectra_version: metadata.spectra_version,
    suite_file: metadata.suite_file,
    cases_passed: passed,
    cases_failed: failed,
    cases_skipped: skipped,
    cases_total: total,
    cases,
    failed_steps: failedStepsFromCases(cases),
    seed: extras.seed === true || extras.seed === "true" || extras.seed === "1" ? true : undefined,
  };
}

export function toManifestRow(run) {
  return {
    id: run.id,
    repo: run.repo,
    org: run.org,
    suite: run.suite,
    status: run.status,
    pass_rate: run.pass_rate,
    started_at: run.started_at,
    finished_at: run.finished_at,
    duration_ms: run.duration_ms,
    pr: run.pr ?? null,
    branch: run.branch,
    commit: run.commit,
    github_run_url: run.github_run_url,
    cases_passed: run.cases_passed,
    cases_failed: run.cases_failed,
    cases_skipped: run.cases_skipped ?? 0,
    cases_total: run.cases_total,
    ...(run.seed ? { seed: true } : {}),
  };
}
