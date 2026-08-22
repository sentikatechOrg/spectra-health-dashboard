#!/usr/bin/env node
/**
 * Remove run records from data/ (maintainers only).
 *
 *   node scripts/remove-runs.mjs --ids id1,id2
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

const idList = String(args.ids || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

if (!idList.length) {
  console.error("Usage: node scripts/remove-runs.mjs --ids id1,id2");
  process.exit(1);
}

const manifest = await readJson(manifestPath);
const runs = Array.isArray(manifest.runs) ? manifest.runs : [];
const keep = runs.filter((run) => !idList.includes(run.id));
const removed = runs.filter((run) => idList.includes(run.id));

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
