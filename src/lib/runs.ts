import { useEffect, useState } from "react";
import { loadManifest } from "./load";
import type { ManifestRun } from "../types";

export function useRuns() {
  const [runs, setRuns] = useState<ManifestRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManifest()
      .then((manifest) => setRuns(manifest.runs || []))
      .catch((err: Error) => setError(err.message));
  }, []);

  return { runs, error };
}
