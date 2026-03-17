import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { X, Trash2, CalendarCheck, Star, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

type TaskWithMeta = Doc<"tasks"> & {
  assigneeName: string;
  projectName: string;
};

type DayDetailPanelProps = {
  date: Date;
  tasks: TaskWithMeta[];
  holidays: Doc<"holidays">[];
  isAdminOrManager: boolean;
  onClose: () => void;
};

const statusStyles: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  complete: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  overdue: "Overdue",
};

const priorityIcons: Record<string, { icon: typeof Star; className: string }> = {
  high: { icon: AlertTriangle, className: "text-red-500" },
  medium: { icon: Star, className: "text-amber-500" },
  low: { icon: Star, className: "text-muted-foreground" },
};

export default function DayDetailPanel({ date, tasks, holidays, isAdminOrManager, onClose }: DayDetailPanelProps) {
  const removeHoliday = useMutation(api.holidays.remove);

  const handleDeleteHoliday = async (id: Doc<"holidays">["_id"]) => {
    try {
      await removeHoliday({ id });
      toast.success("Holiday removed");
    } catch {
      toast.error("Failed to remove holiday");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div>
          <p className="text-lg font-bold text-foreground">
            {format(date, "EEEE")}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
        {/* Holidays */}
        {holidays.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              Holidays / Events
            </h4>
            {holidays.map((h) => (
              <div
                key={h._id}
                className="flex items-center justify-between bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground">{h.eventName}</span>
                {isAdminOrManager && (
                  <button
                    onClick={() => handleDeleteHoliday(h._id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tasks Due ({tasks.length})
            </h4>
            {tasks.map((task) => {
              const PriorityIcon = priorityIcons[task.priority]?.icon ?? Star;
              const priorityClass = priorityIcons[task.priority]?.className ?? "";
              return (
                <div
                  key={task._id}
                  className="bg-muted/40 border border-border/50 rounded-lg px-3 py-2.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground leading-snug">{task.title}</span>
                    <PriorityIcon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", priorityClass)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusStyles[task.status])}>
                      {statusLabels[task.status]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{task.projectName}</span>
                    <span className="text-[10px] text-muted-foreground/50">{"/"}</span>
                    <span className="text-[10px] text-muted-foreground">{task.assigneeName}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${task.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {task.progressPercentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nothing scheduled for this day</p>
        ) : null}
      </div>
    </div>
  );
}
