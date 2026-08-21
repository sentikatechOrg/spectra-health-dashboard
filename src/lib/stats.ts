import type { ManifestRun, RangeKey } from "../types";

export function filterByRange(runs: ManifestRun[], range: RangeKey, now = Date.now()): ManifestRun[] {
  if (range === "all") return runs;
  const days = range === "90" ? 90 : 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return runs.filter((run) => Date.parse(run.started_at) >= cutoff);
}

export function totals(runs: ManifestRun[]) {
  const casesPassed = runs.reduce((sum, run) => sum + (run.cases_passed || 0), 0);
  const casesFailed = runs.reduce((sum, run) => sum + (run.cases_failed || 0), 0);
  const casesSkipped = runs.reduce((sum, run) => sum + (run.cases_skipped || 0), 0);
  const casesTotal = runs.reduce((sum, run) => sum + (run.cases_total ?? run.cases_passed + run.cases_failed + (run.cases_skipped || 0)), 0);
  const passRate = casesTotal > 0 ? casesPassed / casesTotal : 0;
  const avgDuration = runs.length ? runs.reduce((sum, run) => sum + run.duration_ms, 0) / runs.length : 0;
  const failedRuns = runs.filter((run) => run.status === "failed").length;
  return { casesPassed, casesFailed, casesSkipped, casesTotal, passRate, avgDuration, failedRuns, runCount: runs.length };
}

/** Latest result per repo+suite. "Open" = that latest result failed. */
export function openFailures(runs: ManifestRun[]): ManifestRun[] {
  const latest = new Map<string, ManifestRun>();
  const sorted = [...runs].sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
  for (const run of sorted) {
    const key = `${run.repo}::${run.suite}`;
    if (!latest.has(key)) latest.set(key, run);
  }
  return [...latest.values()].filter((run) => run.status === "failed");
}

export function trendPoints(runs: ManifestRun[]) {
  const byDay = new Map<string, ManifestRun[]>();
  const sorted = [...runs].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
  for (const run of sorted) {
    const day = run.started_at.slice(0, 10);
    const list = byDay.get(day) || [];
    list.push(run);
    byDay.set(day, list);
  }
  return [...byDay.entries()].map(([day, dayRuns]) => {
    const stats = totals(dayRuns);
    return {
      day,
      passRate: Number((stats.passRate * 100).toFixed(1)),
      durationMin: Number((stats.avgDuration / 60000).toFixed(2)),
      failed: stats.failedRuns,
      runs: dayRuns.length,
    };
  });
}

export function failuresBySuite(runs: ManifestRun[]) {
  const map = new Map<string, { name: string; failed: number; total: number }>();
  for (const run of runs) {
    const name = `${shortRepo(run.repo)} · ${run.suite}`;
    const row = map.get(name) || { name, failed: 0, total: 0 };
    row.total += 1;
    if (run.status === "failed") row.failed += 1;
    map.set(name, row);
  }
  return [...map.values()].sort((a, b) => b.failed - a.failed);
}

export function shortRepo(repo: string): string {
  return repo.includes("/") ? repo.split("/")[1] : repo;
}

export function groupByRepo(runs: ManifestRun[]) {
  const map = new Map<string, ManifestRun[]>();
  for (const run of runs) {
    const list = map.get(run.repo) || [];
    list.push(run);
    map.set(run.repo, list);
  }
  return [...map.entries()].map(([repo, repoRuns]) => {
    const sorted = [...repoRuns].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
    const stats = totals(sorted);
    const latest = sorted[sorted.length - 1];
    const spark = sorted.map((run) => ({
      day: run.started_at.slice(0, 10),
      passRate: Math.round(run.pass_rate * 100),
    }));
    const hasPass = sorted.some((run) => run.status === "passed");
    const hasFail = sorted.some((run) => run.status === "failed");
    const flaky = hasPass && hasFail;
    const median = medianDuration(sorted);
    const slow = latest && median > 0 && latest.duration_ms > median * 1.5;
    return { repo, runs: sorted, stats, latest, spark, flaky, slow };
  });
}

function medianDuration(runs: ManifestRun[]): number {
  if (!runs.length) return 0;
  const values = [...runs.map((run) => run.duration_ms)].sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

export function verdict(runs: ManifestRun[]): { title: string; detail: string; tone: "good" | "watch" | "bad" } {
  if (!runs.length) {
    return { title: "No test runs in this period", detail: "Connect a frontend repo to start collecting health history.", tone: "watch" };
  }
  const sorted = [...runs].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
  const mid = Math.max(1, Math.floor(sorted.length / 2));
  const earlier = totals(sorted.slice(0, mid)).passRate;
  const later = totals(sorted.slice(mid)).passRate;
  const overall = totals(sorted).passRate;
  const open = openFailures(sorted).length;
  const delta = later - earlier;

  if (open === 0 && overall >= 0.9) {
    return { title: "Apps look healthy", detail: "Latest checks passed. Quality is holding.", tone: "good" };
  }
  if (delta >= 0.08) {
    return { title: "Getting healthier", detail: `Pass rate improved ${Math.round(delta * 100)} points versus the first half of this period.`, tone: "good" };
  }
  if (delta <= -0.08 || open > 0) {
    return {
      title: open > 0 ? "Some apps need attention" : "Quality is slipping",
      detail: open > 0
        ? `${open} suite${open === 1 ? "" : "s"} still red on the latest run.`
        : `Pass rate dropped ${Math.round(Math.abs(delta) * 100)} points versus earlier in this period.`,
      tone: "bad",
    };
  }
  return { title: "Holding steady — watch the red items", detail: "Overall pass rate is mixed. Review failing suites before the next release.", tone: "watch" };
}

export function dayHealth(runs: ManifestRun[]): Map<string, "good" | "bad" | "mixed"> {
  const map = new Map<string, ManifestRun[]>();
  for (const run of runs) {
    const day = run.started_at.slice(0, 10);
    const list = map.get(day) || [];
    list.push(run);
    map.set(day, list);
  }
  const health = new Map<string, "good" | "bad" | "mixed">();
  for (const [day, dayRuns] of map) {
    const failed = dayRuns.some((run) => run.status === "failed");
    const passed = dayRuns.some((run) => run.status === "passed");
    health.set(day, failed && passed ? "mixed" : failed ? "bad" : "good");
  }
  return health;
}
