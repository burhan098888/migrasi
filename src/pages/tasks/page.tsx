import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";
import { format } from "date-fns";
import TaskFormDialog from "./_components/task-form-dialog.tsx";
import TaskFiltersBar, {
  type TaskFilters,
} from "./_components/task-filters.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const STATUS_STYLES = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  complete: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
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
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
} as const;

type EnrichedTask = {
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
  assigneeName: string;
  projectName: string;
  divisionName: string | null;
};

export default function TasksPage() {
  const { user: currentUser, isAdminOrManager } = useUserRole();
  const tasks = useQuery(api.tasks.list);
  const markOverdue = useMutation(api.tasks.markOverdueTasks);
  const removeTask = useMutation(api.tasks.remove);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    projectId: "all",
    divisionId: "all",
    assigneeId: "all",
    status: "all",
    priority: "all",
  });

  // Auto-mark overdue tasks on mount
  useEffect(() => {
    if (currentUser) {
      markOverdue({}).catch(() => {
        // Silently fail — not critical
      });
    }
  }, [currentUser, markOverdue]);

  useEffect(() => {
    if (currentUser && !isAdminOrManager) {
      toast.error("Only admins and managers can access the task manager");
      navigate("/dashboard");
    }
  }, [currentUser, isAdminOrManager, navigate]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (filters.projectId !== "all" && t.projectId !== filters.projectId)
        return false;
      if (
        filters.divisionId !== "all" &&
        (t.divisionId ?? "") !== filters.divisionId
      )
        return false;
      if (filters.assigneeId !== "all" && t.assigneeId !== filters.assigneeId)
        return false;
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.priority !== "all" && t.priority !== filters.priority)
        return false;
      return true;
    });
  }, [tasks, filters]);

  if (!tasks || !currentUser) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-32" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!isAdminOrManager) return null;

  const openCreate = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const openEdit = (task: EnrichedTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (id: Id<"tasks">) => {
    try {
      await removeTask({ id });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Master Task Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, assign, and manage all tasks across projects
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TaskFiltersBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Task count */}
      <div className="mb-3 text-xs text-muted-foreground">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Table */}
      {filteredTasks.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodo />
            </EmptyMedia>
            <EmptyTitle>
              {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
            </EmptyTitle>
            <EmptyDescription>
              {tasks.length === 0
                ? "Create your first task to get started"
                : "Try adjusting your filters"}
            </EmptyDescription>
          </EmptyHeader>
          {tasks.length === 0 && (
            <EmptyContent>
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" />
                New Task
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold min-w-[180px]">
                  Task
                </TableHead>
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Division</TableHead>
                <TableHead className="font-semibold">Assignee</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Deadline</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Progress</TableHead>
                <TableHead className="font-semibold text-right">
                  Budget
                </TableHead>
                <TableHead className="font-semibold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task._id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[200px]">
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.projectName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.divisionName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {task.assigneeName?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <span className="text-sm">{task.assigneeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize ${PRIORITY_STYLES[task.priority]}`}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(task.deadline), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${STATUS_STYLES[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${task.progressPercentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                        {task.progressPercentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-xs">
                      <span className="text-muted-foreground">
                        ${task.budgetAllocated.toLocaleString()}
                      </span>
                      {task.budgetRealized > 0 && (
                        <span className="block text-foreground font-medium">
                          ${task.budgetRealized.toLocaleString()} used
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(task as EnrichedTask)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task._id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form dialog */}
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTask={editingTask}
      />
    </div>
  );
}
