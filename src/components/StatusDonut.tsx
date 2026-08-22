import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = { passed: "#1b8a5a", failed: "#c9372c", skipped: "#6b778c" };

export function StatusDonut({ passed, failed, skipped, fill }: { passed: number; failed: number; skipped: number; fill?: boolean }) {
  const data = [
    { name: "Passed", value: passed, key: "passed" as const },
    { name: "Failed", value: failed, key: "failed" as const },
    { name: "Skipped", value: skipped, key: "skipped" as const },
  ].filter((row) => row.value > 0);

  if (!data.length) {
    return <p className="empty">No cases in this period.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={fill ? "100%" : 220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={fill ? 40 : 58} outerRadius={fill ? 62 : 86} paddingAngle={2}>
          {data.map((row) => (
            <Cell key={row.key} fill={COLORS[row.key]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value} cases`, name]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
