export type RunStatus = "passed" | "failed";
export type CaseStatus = "passed" | "failed" | "skipped";

export interface FailedStep {
  case_id: string;
  case_name?: string;
  step: number;
  type?: string;
  selector?: string;
  message: string;
  screenshot?: string;
}

export interface StepRecord {
  stepIndex: number;
  type: string;
  description?: string;
  status: CaseStatus;
  duration_ms: number;
  message?: string;
  artifacts?: Record<string, string>;
}

export interface CaseRecord {
  id: string;
  name: string;
  status: CaseStatus;
  duration_ms: number;
  error?: string;
  steps: StepRecord[];
}

/** Lightweight row stored in data/manifest.json (newest first). */
export interface ManifestRun {
  id: string;
  repo: string;
  org?: string;
  suite: string;
  status: RunStatus;
  pass_rate: number;
  started_at: string;
  finished_at?: string;
  duration_ms: number;
  pr?: number | null;
  branch?: string;
  commit?: string;
  commit_owner?: string;
  github_run_url?: string;
  cases_passed: number;
  cases_failed: number;
  cases_skipped?: number;
  cases_total?: number;
}

export interface Manifest {
  generated_at: string;
  cap: number;
  runs: ManifestRun[];
}

/** Full normalized run written to data/runs/{id}.json */
export interface NormalizedRun extends ManifestRun {
  ingested_at?: string;
  github_run_id?: string;
  workflow_url?: string;
  html_report?: string;
  frontend_commit?: string;
  frontend_branch?: string;
  spectra_version?: string;
  suite_file?: string;
  cases: CaseRecord[];
  failed_steps: FailedStep[];
}

/** Raw Spectra CLI JSON report (subset we consume). */
export interface SpectraReport {
  suite: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  metadata?: {
    spectra_version?: string;
    suite_file?: string;
    project?: { path?: string; commit?: string; short_commit?: string; branch?: string };
    frontend?: { path?: string; commit?: string; short_commit?: string; branch?: string };
  };
  cases: CaseRecord[];
}

export type RangeKey = "30" | "90" | "all";

export interface DashboardConfig {
  org: string;
  repo: string;
  title: string;
  subtitle: string;
  pagesBase: string;
  manifestCap: number;
  connectedRepos: string[];
}
