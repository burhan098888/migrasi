import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { sendTaskToWhatsApp } from "../_lib/whatsapp.ts";

type TaskFormData = {
  title: string;
  projectId: string;
  divisionId: string;
  assigneeId: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  budgetAllocated: string;
  budgetRealized: string;
  status: "not_started" | "in_progress" | "complete" | "overdue";
  progressPercentage: string;
  notes: string;
};

const INITIAL_FORM: TaskFormData = {
  title: "",
  projectId: "",
  divisionId: "",
  assigneeId: "",
  priority: "medium",
  deadline: "",
  budgetAllocated: "0",
  budgetRealized: "0",
  status: "not_started",
  progressPercentage: "0",
  notes: "",
};

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

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask: EnrichedTask | null;
};

export default function TaskFormDialog({
  open,
  onOpenChange,
  editingTask,
}: TaskFormDialogProps) {
  const { demoModeArg } = useDemoMode();
  const projects = useQuery(api.projects.list, { demoMode: demoModeArg });
  const divisions = useQuery(api.divisions.list, { demoMode: demoModeArg });
  const users = useQuery(api.users.listAll, { demoMode: demoModeArg });
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);

  const [form, setForm] = useState<TaskFormData>(INITIAL_FORM);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        projectId: editingTask.projectId,
        divisionId: editingTask.divisionId ?? "",
        assigneeId: editingTask.assigneeId,
        priority: editingTask.priority,
        deadline: editingTask.deadline.split("T")[0],
        budgetAllocated: String(editingTask.budgetAllocated),
        budgetRealized: String(editingTask.budgetRealized),
        status: editingTask.status,
        progressPercentage: String(editingTask.progressPercentage),
        notes: editingTask.notes,
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [editingTask, open]);

  const handleSubmit = async () => {
    if (!form.title || !form.projectId || !form.assigneeId || !form.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const payload = {
        title: form.title,
        projectId: form.projectId as Id<"projects">,
        divisionId: form.divisionId
          ? (form.divisionId as Id<"divisions">)
          : undefined,
        assigneeId: form.assigneeId as Id<"users">,
        priority: form.priority,
        deadline: new Date(form.deadline).toISOString(),
        budgetAllocated: parseFloat(form.budgetAllocated) || 0,
        budgetRealized: parseFloat(form.budgetRealized) || 0,
        status: form.status,
        progressPercentage: parseInt(form.progressPercentage) || 0,
        notes: form.notes,
      };

      if (editingTask) {
        await updateTask({ id: editingTask._id, ...payload });
        toast.success("Task updated");
      } else {
        await createTask(payload);

        // Resolve names for the WhatsApp message
        const projectName =
          projects?.find((p) => p._id === form.projectId)?.name ?? "Unknown";
        const assigneeName =
          users?.find((u) => u._id === form.assigneeId)?.name ?? "Unknown";
        const divisionName = form.divisionId
          ? (divisions?.find((d) => d._id === form.divisionId)?.name ?? null)
          : null;

        toast.success("Task created", {
          description: "Send the task details to WhatsApp?",
          action: {
            label: "Send to WhatsApp",
            onClick: () =>
              sendTaskToWhatsApp({
                title: form.title,
                projectName,
                divisionName,
                assigneeName,
                priority: form.priority,
                deadline: format(new Date(form.deadline), "MMM d, yyyy"),
                status: form.status,
                progressPercentage: parseInt(form.progressPercentage) || 0,
                budgetAllocated: parseFloat(form.budgetAllocated) || 0,
                budgetRealized: parseFloat(form.budgetRealized) || 0,
                notes: form.notes,
              }),
          },
          duration: 8000,
        });
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save task");
    }
  };

  const updateField = <K extends keyof TaskFormData>(
    key: K,
    value: TaskFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <Label>
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Design homepage mockup"
            />
          </div>

          {/* Project & Division */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Project <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.projectId}
                onValueChange={(val) => updateField("projectId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Division</Label>
              <Select
                value={form.divisionId || "none"}
                onValueChange={(val) =>
                  updateField("divisionId", val === "none" ? "" : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Division</SelectItem>
                  {divisions?.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Assignee (PIC) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.assigneeId}
                onValueChange={(val) => updateField("assigneeId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name ?? u.email ?? "Unnamed"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(val) =>
                  updateField("priority", val as TaskFormData["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Deadline <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => updateField("deadline", e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  updateField("status", val as TaskFormData["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Allocated</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budgetAllocated}
                onChange={(e) => updateField("budgetAllocated", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Budget Realized</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budgetRealized}
                onChange={(e) => updateField("budgetRealized", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <Label>Progress (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.progressPercentage}
                onChange={(e) =>
                  updateField("progressPercentage", e.target.value)
                }
                className="w-24"
              />
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, parseInt(form.progressPercentage) || 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Additional remarks..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {editingTask ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
