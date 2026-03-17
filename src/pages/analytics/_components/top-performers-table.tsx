type Performer = { name: string; completed: number; total: number };

export default function TopPerformersTable({ data }: { data: Performer[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
        No completed tasks yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Employee
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Done
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Rate
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => {
            const rate = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            return (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 px-3 font-medium text-foreground">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{p.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                  {p.completed}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                  {p.total}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {rate}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
