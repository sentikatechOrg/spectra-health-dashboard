import type { Manifest, NormalizedRun } from "../types";

const base = import.meta.env.BASE_URL;

export async function loadManifest(): Promise<Manifest> {
  const response = await fetch(`${base}data/manifest.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load results (${response.status})`);
  }
  return response.json();
}

export async function loadRun(id: string): Promise<NormalizedRun> {
  const response = await fetch(`${base}data/runs/${encodeURIComponent(id)}.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load this run (${response.status})`);
  }
  return response.json();
}

export function artifactUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}data/${path.replace(/^\/+/, "")}`;
}
