import { useEffect, useMemo, useState } from "react";
import { loadManifest } from "./load";
import type { ManifestRun } from "../types";

export function withoutSeed(runs: ManifestRun[], includeSeed = false): ManifestRun[] {
  return includeSeed ? runs : runs.filter((run) => !run.seed);
}

export function useRuns() {
  const [runs, setRuns] = useState<ManifestRun[]>([]);
  const [includeSeed, setIncludeSeed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManifest()
      .then((manifest) => setRuns(manifest.runs || []))
      .catch((err: Error) => setError(err.message));
  }, []);

  const seedCount = useMemo(() => runs.filter((run) => run.seed).length, [runs]);
  const visible = useMemo(() => withoutSeed(runs, includeSeed), [runs, includeSeed]);

  return { runs, visible, includeSeed, setIncludeSeed, seedCount, error };
}
