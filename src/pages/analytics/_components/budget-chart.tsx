import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatRupiah, formatRupiahCompact } from "@/lib/currency.ts";

type DataItem = { name: string; allocated: number; realized: number };

export default function BudgetChart({ data }: { data: DataItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No budget data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatRupiahCompact}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatRupiah(value), name]}
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "13px",
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
        <Bar dataKey="allocated" name="Allocated" radius={[6, 6, 0, 0]} fill="oklch(0.65 0.15 250)" />
        <Bar dataKey="realized" name="Realized" radius={[6, 6, 0, 0]} fill="oklch(0.72 0.17 80)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
