import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { toast } from "sonner";
import { useState } from "react";
import {
  CalendarDays,
  FolderKanban,
  Building2,
  Save,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { sendTaskToWhatsApp } from "@/lib/whatsapp.ts";

const STATUS_STYLES = {
  not_started: "bg-muted text-muted-foreground",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  complete:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
} as const;

const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  overdue: "Overdue",
} as const;

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
} as const;

type TaskData = {
  _id: Id<"tasks">;
  title: string;
  projectId: Id<"projects">;
  divisionId?: Id<"divisions">;
  assigneeId: Id<"users">;
  priority: "low" | "medium" | "high";
  deadline: string;
  budgetAllocated: number;
  budgetRealized: number;
  status: "not_started" | "in_progress" | "complete" | "overdue";
  progressPercentage: number;
  notes: string;
  projectName: string;
  divisionName: string | null;
};

type TaskCardProps = {
  task: TaskData;
};

export default function TaskCard({ task }: TaskCardProps) {
  const updateMyTask = useMutation(api.tasks.updateMyTask);
  const updateTask = useMutation(api.tasks.update);
  const { isAdminOrManager, user: currentUser } = useUserRole();
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(task.progressPercentage);
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    progress !== task.progressPercentage ||
    (isAdminOrManager && status !== task.status) ||
    notes !== task.notes;

  const isOverdue =
    task.status === "overdue" ||
    (new Date(task.deadline) < new Date() &&
      task.progressPercentage < 100 &&
      task.status !== "complete");

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isAdminOrManager) {
        // Admin/manager can update status
        await updateTask({
          id: task._id,
          progressPercentage: progress,
          status,
          notes,
        });
      } else {
        // Staff can only update progress and notes
        await updateMyTask({
          id: task._id,
          progressPercentage: progress,
          notes,
        });
      }
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  // Auto-set status when progress changes (only for admin/manager)
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    if (isAdminOrManager) {
      if (newProgress === 100 && status !== "complete") {
        setStatus("complete");
      } else if (newProgress > 0 && newProgress < 100 && status === "not_started") {
        setStatus("in_progress");
      }
    }
  };

  return (
    <div
      className={`bg-card border rounded-xl transition-all ${
        isOverdue
          ? "border-red-300 dark:border-red-800"
          : "border-border hover:border-primary/20"
      }`}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-4"
      >
        {/* Progress circle */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              className="stroke-border"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              className={
                progress === 100
                  ? "stroke-green-500"
                  : isOverdue
                    ? "stroke-red-500"
                    : "stroke-primary"
              }
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
            {progress}%
          </span>
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="secondary"
                className={`text-[10px] ${PRIORITY_STYLES[task.priority]}`}
              >
                {task.priority}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-[10px] ${STATUS_STYLES[status]}`}
              >
                {STATUS_LABELS[status]}
              </Badge>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FolderKanban className="w-3 h-3" />
              {task.projectName}
            </span>
            {task.divisionName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {task.divisionName}
              </span>
            )}
            <span
              className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}
            >
              <CalendarDays className="w-3 h-3" />
              {format(new Date(task.deadline), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </button>

      {/* Expandable edit section */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border mt-0">
          <div className="pt-4">
            {/* Progress slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Progress
                </label>
                <span className="text-sm font-mono text-primary font-semibold">
                  {progress}%
                </span>
              </div>
              <Slider
                value={[progress]}
                onValueChange={handleProgressChange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* Status — editable for admin/manager, read-only for staff */}
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Status
              </label>
              {isAdminOrManager ? (
                <Select
                  value={status}
                  onValueChange={(val) =>
                    setStatus(
                      val as
                        | "not_started"
                        | "in_progress"
                        | "complete"
                        | "overdue",
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="secondary"
                  className={`text-xs ${STATUS_STYLES[task.status]}`}
                >
                  {STATUS_LABELS[task.status]}
                </Badge>
              )}
            </div>

            {/* Notes / Remarks */}
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Notes / Remarks
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your remarks here..."
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex-1"
                size="sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  sendTaskToWhatsApp({
                    title: task.title,
                    projectName: task.projectName,
                    divisionName: task.divisionName,
                    assigneeName: currentUser?.name ?? "Staff",
                    priority: task.priority,
                    deadline: format(new Date(task.deadline), "MMM d, yyyy"),
                    status: task.status,
                    progressPercentage: task.progressPercentage,
                    budgetAllocated: task.budgetAllocated,
                    budgetRealized: task.budgetRealized,
                    notes: task.notes,
                  })
                }
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Send to admin WhatsApp"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
