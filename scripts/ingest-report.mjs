#!/usr/bin/env node
/**
 * Normalize a Spectra JSON report into a dashboard run record.
 *
 *   node scripts/ingest-report.mjs \
 *     --report path/to/spectra-report.json \
 *     --repo sentikatechOrg/sentikatech-frontend \
 *     --run-id 32528125817 \
 *     --pr 3 \
 *     --branch feat/spectra-pr-gate \
 *     --workflow-url https://github.com/org/repo/actions/runs/32528125817 \
 *     --out data/runs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeReport, parseArgs, readJson } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));

if (!args.report) {
  console.error("Usage: node scripts/ingest-report.mjs --report <spectra-report.json> [--repo org/name] [--run-id id] [--out data/runs]");
  process.exit(1);
}

const report = await readJson(path.resolve(args.report));
const run = normalizeReport(report, {
  repo: args.repo,
  github_run_id: args["run-id"] || args.run_id,
  pr: args.pr,
  branch: args.branch,
  commit: args.commit,
  github_run_url: args["workflow-url"] || args.workflow_url,
  html_report: args["html-report"] || args.html_report,
  id: args.id,
});

if (args.out) {
  const dir = path.resolve(args.out);
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${run.id}.json`);
  await writeFile(dest, `${JSON.stringify(run, null, 2)}\n`);
  console.log(`Wrote ${dest}`);
}

if (args.stdout || !args.out) {
  process.stdout.write(`${JSON.stringify(run, null, 2)}\n`);
}
