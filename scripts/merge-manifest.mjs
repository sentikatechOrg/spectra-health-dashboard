#!/usr/bin/env node
/**
 * Append a normalized run to data/manifest.json (newest first).
 * Caps at --cap (default 500) and moves overflow into data/archive/.
 *
 *   node scripts/merge-manifest.mjs --run data/runs/{id}.json --manifest data/manifest.json
 */
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs, readJson, toManifestRow } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.run || !args.manifest) {
  console.error("Usage: node scripts/merge-manifest.mjs --run <run.json> --manifest data/manifest.json [--cap 500] [--archive-dir data/archive]");
  process.exit(1);
}

const cap = Number(args.cap || process.env.MANIFEST_CAP || 500);
const archiveDir = path.resolve(args["archive-dir"] || path.join(path.dirname(args.manifest), "archive"));
const run = await readJson(path.resolve(args.run));
const row = toManifestRow(run);

let manifest = { generated_at: new Date().toISOString(), cap, runs: [] };
try {
  manifest = await readJson(path.resolve(args.manifest));
} catch {
  // first ingest
}

const existing = Array.isArray(manifest.runs) ? manifest.runs : [];
const without = existing.filter((item) => item.id !== row.id);
const merged = [row, ...without].sort((a, b) => {
  const aTime = Date.parse(a.started_at || "") || 0;
  const bTime = Date.parse(b.started_at || "") || 0;
  return bTime - aTime;
});

const kept = merged.slice(0, cap);
const overflow = merged.slice(cap);

if (overflow.length) {
  await mkdir(archiveDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(archiveDir, `overflow-${stamp}.json`);
  await writeFile(dest, `${JSON.stringify({ archived_at: new Date().toISOString(), runs: overflow }, null, 2)}\n`);
  for (const old of overflow) {
    const runFile = path.join(path.dirname(args.manifest), "runs", `${old.id}.json`);
    try {
      await mkdir(path.join(archiveDir, "runs"), { recursive: true });
      await rename(runFile, path.join(archiveDir, "runs", `${old.id}.json`));
    } catch {
      // run file may already be archived
    }
  }
  console.log(`Archived ${overflow.length} run(s) to ${dest}`);
}

const next = {
  generated_at: new Date().toISOString(),
  cap,
  runs: kept,
};

await writeFile(path.resolve(args.manifest), `${JSON.stringify(next, null, 2)}\n`);
console.log(`Manifest now has ${kept.length} run(s)`);
