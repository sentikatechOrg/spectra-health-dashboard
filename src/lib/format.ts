export function formatPct(value: number): string {
  if (Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatDuration(ms: number): string {
  if (!ms && ms !== 0) return "—";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return sec ? `${min}m ${sec}s` : `${min}m`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  return rem ? `${hr}h ${rem}m` : `${hr}h`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Calendar day in the viewer's timezone, matching the Latest runs table. */
export function localDateKey(iso?: string, date = iso ? new Date(iso) : undefined): string {
  const value = date ?? new Date();
  if (Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDay(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function repoName(repo: string): string {
  return repo.includes("/") ? repo.split("/")[1] : repo;
}

export function statusLabel(status: string): string {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  if (status === "skipped") return "Skipped";
  return status;
}

export function healthWord(passRate: number): { label: string; tone: "good" | "watch" | "bad" } {
  if (passRate >= 0.9) return { label: "Healthy", tone: "good" };
  if (passRate >= 0.7) return { label: "Watch", tone: "watch" };
  return { label: "Needs attention", tone: "bad" };
}
