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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type ProjectFormData = {
  name: string;
  startDate: string;
  endDate: string;
  ownerId: string;
};

const INITIAL_FORM: ProjectFormData = {
  name: "",
  startDate: "",
  endDate: "",
  ownerId: "",
};

export default function ProjectsPage() {
  const { user: currentUser, isAdminOrManager } = useUserRole();
  const { demoModeArg } = useDemoMode();
  const projects = useQuery(api.projects.list, { demoMode: demoModeArg });
  const users = useQuery(api.users.listAll, { demoMode: demoModeArg });
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"projects"> | null>(null);
  const [form, setForm] = useState<ProjectFormData>(INITIAL_FORM);

  useEffect(() => {
    if (currentUser && !isAdminOrManager) {
      toast.error("Only admins and managers can manage projects");
      navigate("/dashboard");
    }
  }, [currentUser, isAdminOrManager, navigate]);

  if (!projects || !users || !currentUser) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!isAdminOrManager) return null;

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (project: (typeof projects)[number]) => {
    setForm({
      name: project.name,
      startDate: project.startDate.split("T")[0],
      endDate: project.endDate.split("T")[0],
      ownerId: project.ownerId,
    });
    setEditingId(project._id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate || !form.ownerId) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      if (editingId) {
        await updateProject({
          id: editingId,
          name: form.name,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          ownerId: form.ownerId as Id<"users">,
        });
        toast.success("Project updated");
      } else {
        await createProject({
          name: form.name,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          ownerId: form.ownerId as Id<"users">,
        });
        toast.success("Project created");
      }
      setDialogOpen(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
    } catch {
      toast.error("Failed to save project");
    }
  };

  const handleDelete = async (id: Id<"projects">) => {
    try {
      await removeProject({ id });
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage projects and track overall progress
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Project" : "New Project"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Website Redesign"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Project Owner</Label>
                <Select
                  value={form.ownerId}
                  onValueChange={(val) => setForm({ ...form, ownerId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name ?? u.email ?? "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create your first project to start managing tasks
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Owner</TableHead>
                <TableHead className="font-semibold">Start</TableHead>
                <TableHead className="font-semibold">End</TableHead>
                <TableHead className="font-semibold">Progress</TableHead>
                <TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.ownerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.startDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.endDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${p.overallProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {p.overallProgress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(p)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p._id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
    </div>
  );
}
