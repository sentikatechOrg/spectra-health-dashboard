import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDay } from "../lib/format";

export function PassRateTrend({ data, fill }: { data: { day: string; passRate: number }[]; fill?: boolean }) {
  if (!data.length) return <p className="empty">Not enough history yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={fill ? "100%" : 220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#ebecf0" vertical={false} />
        <XAxis dataKey="day" tickFormatter={(value) => formatDay(value)} tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={42} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(value) => formatDay(String(value))} formatter={(value: number) => [`${value}%`, "Pass rate"]} />
        <Area type="monotone" dataKey="passRate" stroke="#1b8a5a" fill="#e3f5ec" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DurationTrend({ data, fill }: { data: { day: string; durationMin: number }[]; fill?: boolean }) {
  if (!data.length) return <p className="empty">Not enough history yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={fill ? "100%" : 220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#ebecf0" vertical={false} />
        <XAxis dataKey="day" tickFormatter={(value) => formatDay(value)} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(value) => `${value}m`} width={42} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={(value) => formatDay(String(value))} formatter={(value: number) => [`${value} min`, "Avg duration"]} />
        <Area type="monotone" dataKey="durationMin" stroke="#16365c" fill="#e8eef6" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
