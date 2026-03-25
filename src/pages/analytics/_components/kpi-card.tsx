import { cn } from "@/lib/utils.ts";
import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
};

const accentStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
} as const;

export default function KpiCard({ title, value, subtitle, icon: Icon, accent = "default", onClick }: KpiCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-5 flex items-start gap-4 text-left w-full",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-md transition-all",
      )}
    >
      <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center shrink-0", accentStyles[accent])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        {onClick && <p className="text-[10px] text-primary mt-1 font-medium">Click to view details</p>}
      </div>
    </Wrapper>
  );
}
