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
} from "@/components/ui/empty.tsx";
import { useEffect, useState, useMemo } from "react";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import TaskCard from "./_components/task-card.tsx";

type StatusFilter = "all" | "not_started" | "in_progress" | "complete" | "overdue";
type PriorityFilter = "all" | "low" | "medium" | "high";

export default function MyTasksPage() {
  const { user } = useUserRole();
  const tasks = useQuery(api.tasks.listByAssignee);
  const markOverdue = useMutation(api.tasks.markOverdueTasks);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  // Mark overdue tasks on mount
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

  if (!user || tasks === undefined) {
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Your personal workspace — update progress and leave remarks
        </p>
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
                ? "No tasks assigned to you"
                : "No matching tasks"}
            </EmptyTitle>
            <EmptyDescription>
              {tasks.length === 0
                ? "Ask your manager to assign tasks to you"
                : "Try adjusting your filters"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
