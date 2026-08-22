#!/usr/bin/env node
/**
 * Remove run records from data/ (maintainers only).
 *
 *   node scripts/remove-runs.mjs --seed
 *   node scripts/remove-runs.mjs --ids id1,id2
 *   node scripts/remove-runs.mjs --mark-seed --ids id1,id2
 */
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, readJson } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const dataDir = path.resolve(args.data || path.join(root, "data"));
const manifestPath = path.join(dataDir, "manifest.json");
const runsDir = path.join(dataDir, "runs");
const archiveDir = path.join(dataDir, "archive", "runs");

const manifest = await readJson(manifestPath);
const runs = Array.isArray(manifest.runs) ? manifest.runs : [];
const idList = String(args.ids || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

function isTarget(run) {
  if (args.seed) return Boolean(run.seed);
  if (idList.length) return idList.includes(run.id);
  return false;
}

if (!args.seed && !idList.length) {
  console.error("Usage: node scripts/remove-runs.mjs --seed | --ids id1,id2 [--mark-seed]");
  process.exit(1);
}

if (args["mark-seed"]) {
  if (!idList.length) {
    console.error("--mark-seed requires --ids");
    process.exit(1);
  }
  for (const run of runs) {
    if (idList.includes(run.id)) run.seed = true;
  }
  for (const id of idList) {
    const file = path.join(runsDir, `${id}.json`);
    try {
      const full = await readJson(file);
      full.seed = true;
      await writeFile(file, `${JSON.stringify(full, null, 2)}\n`);
    } catch {
      console.warn(`No run file for ${id}`);
    }
  }
  manifest.generated_at = new Date().toISOString();
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Marked ${idList.length} run(s) as seed`);
  process.exit(0);
}

const keep = [];
const removed = [];
for (const run of runs) {
  if (isTarget(run)) removed.push(run);
  else keep.push(run);
}

if (!removed.length) {
  console.log("No matching runs");
  process.exit(0);
}

await mkdir(archiveDir, { recursive: true });
for (const run of removed) {
  const src = path.join(runsDir, `${run.id}.json`);
  const dest = path.join(archiveDir, `${run.id}.json`);
  try {
    await rename(src, dest);
    console.log(`Archived ${run.id}`);
  } catch {
    console.warn(`Already gone: ${run.id}`);
  }
}

manifest.runs = keep;
manifest.generated_at = new Date().toISOString();
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Removed ${removed.length} run(s). Manifest now has ${keep.length}.`);
