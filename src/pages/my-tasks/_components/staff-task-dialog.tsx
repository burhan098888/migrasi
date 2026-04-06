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
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { sendTaskToWhatsApp } from "@/lib/whatsapp.ts";
import { useAuth } from "@/hooks/use-auth.ts";

type StaffTaskFormData = {
  title: string;
  projectId: string;
  divisionId: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  budgetAllocated: string;
  budgetRealized: string;
  notes: string;
};

const INITIAL_FORM: StaffTaskFormData = {
  title: "",
  projectId: "",
  divisionId: "",
  priority: "medium",
  deadline: "",
  budgetAllocated: "0",
  budgetRealized: "0",
  notes: "",
};

type StaffTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function StaffTaskDialog({
  open,
  onOpenChange,
}: StaffTaskDialogProps) {
  const projects = useQuery(api.projects.list, {});
  const divisions = useQuery(api.divisions.list, {});
  const createMyTask = useMutation(api.tasks.createMyTask);
  const { user: authUser } = useAuth();

  const [form, setForm] = useState<StaffTaskFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.title || !form.projectId || !form.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createMyTask({
        title: form.title,
        projectId: form.projectId as Id<"projects">,
        divisionId: form.divisionId
          ? (form.divisionId as Id<"divisions">)
          : undefined,
        priority: form.priority,
        deadline: new Date(form.deadline).toISOString(),
        budgetAllocated: parseFloat(form.budgetAllocated) || 0,
        budgetRealized: parseFloat(form.budgetRealized) || 0,
        notes: form.notes,
      });

      // Resolve names for the WhatsApp message
      const projectName =
        projects?.find((p) => p._id === form.projectId)?.name ?? "Unknown";
      const divisionName = form.divisionId
        ? (divisions?.find((d) => d._id === form.divisionId)?.name ?? null)
        : null;
      const assigneeName = authUser?.profile.name ?? "Staff";

      toast.success("Task created", {
        description: "Notify admin via WhatsApp?",
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
              status: "not_started",
              progressPercentage: 0,
              budgetAllocated: parseFloat(form.budgetAllocated) || 0,
              budgetRealized: parseFloat(form.budgetRealized) || 0,
              notes: form.notes,
            }),
        },
        duration: 8000,
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof StaffTaskFormData>(
    key: K,
    value: StaffTaskFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Your task will be assigned to you. An admin or manager will review and
          approve the status.
        </p>
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

          {/* Priority & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(val) =>
                  updateField("priority", val as StaffTaskFormData["priority"])
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

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Describe what you'll be working on..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
