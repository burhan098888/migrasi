import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type TrendItem = {
  label: string;
  fullLabel: string;
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
};

export default function CompletionTrendChart({ data }: { data: TrendItem[] }) {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No trend data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.70 0.18 155)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="oklch(0.70 0.18 155)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gradInProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "13px",
          }}
          labelFormatter={(label: string) => {
            const item = data.find((d) => d.label === label);
            return item?.fullLabel ?? label;
          }}
        />
        <Legend
          verticalAlign="top"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke="oklch(0.70 0.18 155)"
          strokeWidth={2}
          fill="url(#gradCompleted)"
        />
        <Area
          type="monotone"
          dataKey="inProgress"
          name="In Progress"
          stroke="oklch(0.65 0.15 250)"
          strokeWidth={2}
          fill="url(#gradInProgress)"
        />
        <Area
          type="monotone"
          dataKey="overdue"
          name="Overdue"
          stroke="oklch(0.65 0.20 25)"
          strokeWidth={2}
          fill="url(#gradOverdue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
