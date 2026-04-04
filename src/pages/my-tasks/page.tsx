import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { useEffect, useState, useMemo } from "react";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import TaskCard from "./_components/task-card.tsx";
import StaffTaskDialog from "./_components/staff-task-dialog.tsx";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";

type StatusFilter = "all" | "not_started" | "in_progress" | "complete" | "overdue";
type PriorityFilter = "all" | "low" | "medium" | "high";

export default function MyTasksPage() {
  const { user } = useUserRole();
  const { demoModeArg, isDemoGuest } = useDemoMode();
  const tasks = useQuery(api.tasks.listByAssignee, { demoMode: demoModeArg });
  const markOverdue = useMutation(api.tasks.markOverdueTasks);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Mark overdue tasks on mount (only for authenticated users)
  useEffect(() => {
    if (user) {
      markOverdue({}).catch(() => {});
    }
  }, [user, markOverdue]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Summary stats
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "complete").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      overdue: tasks.filter((t) => t.status === "overdue").length,
    };
  }, [tasks]);

  if (!user && !isDemoGuest) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {isDemoGuest
              ? "Previewing all demo tasks"
              : "Create your own tasks and track progress — admins approve status"}
          </p>
        </div>
        {!isDemoGuest && (
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Task
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.completed}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.inProgress}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.overdue}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilter)}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(val) => setPriorityFilter(val as PriorityFilter)}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Task cards */}
      {filteredTasks.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>
              {tasks.length === 0
                ? "No tasks yet"
                : "No matching tasks"}
            </EmptyTitle>
            <EmptyDescription>
              {tasks.length === 0
                ? "Create your first task to get started"
                : "Try adjusting your filters"}
            </EmptyDescription>
          </EmptyHeader>
          {tasks.length === 0 && (
            <EmptyContent>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New Task
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}

      {/* Staff create task dialog */}
      <StaffTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
