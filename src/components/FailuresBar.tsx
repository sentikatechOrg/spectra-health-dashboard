import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function FailuresBar({ data, fill }: { data: { name: string; failed: number }[]; fill?: boolean }) {
  if (!data.length) return <p className="empty">No failures in this period.</p>;
  return (
    <ResponsiveContainer width="100%" height={fill ? "100%" : 240}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#ebecf0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={fill ? 120 : 160} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => [`${value} failed runs`, "Failures"]} />
        <Bar dataKey="failed" fill="#c9372c" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
