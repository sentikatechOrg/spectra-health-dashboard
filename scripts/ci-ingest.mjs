#!/usr/bin/env node
/**
 * CI entry: find spectra-report-*.json under --reports, normalize each, merge manifest.
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeReport, parseArgs, readJson, toManifestRow } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const reportsDir = path.resolve(args.reports || "reports");
const dataDir = path.resolve(args.data || path.join(root, "data"));
const runsDir = path.join(dataDir, "runs");
const manifestPath = path.join(dataDir, "manifest.json");
const cap = Number(args.cap || 500);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/spectra-report-.*\.json$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const files = await walk(reportsDir);
if (!files.length) {
  console.error(`No spectra-report-*.json found under ${reportsDir}`);
  process.exit(1);
}

await mkdir(runsDir, { recursive: true });

let manifest = { generated_at: new Date().toISOString(), cap, runs: [] };
try {
  manifest = await readJson(manifestPath);
} catch {
  // first ingest
}

const extras = {
  repo: args.repo,
  github_run_id: args["run-id"],
  pr: args.pr,
  branch: args.branch,
  commit: args.commit,
  owner: args.owner,
  github_run_url: args["workflow-url"],
  html_report: args["html-report"],
};

for (const file of files) {
  const report = await readJson(file);
  const run = normalizeReport(report, extras);
  const dest = path.join(runsDir, `${run.id}.json`);
  await writeFile(dest, `${JSON.stringify(run, null, 2)}\n`);
  const row = toManifestRow(run);
  manifest.runs = [row, ...(manifest.runs || []).filter((item) => item.id !== row.id)];
  console.log(`Ingested ${run.id} from ${path.basename(file)}`);
}

manifest.runs.sort((a, b) => (Date.parse(b.started_at || "") || 0) - (Date.parse(a.started_at || "") || 0));
manifest.generated_at = new Date().toISOString();
manifest.cap = cap;
if (manifest.runs.length > cap) {
  manifest.runs = manifest.runs.slice(0, cap);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.runs.length} run(s) to manifest`);
