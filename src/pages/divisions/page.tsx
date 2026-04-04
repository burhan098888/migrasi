import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function DivisionsPage() {
  const { user: currentUser, isAdminOrManager } = useUserRole();
  const { demoModeArg, isDemoGuest } = useDemoMode();
  const divisions = useQuery(api.divisions.list, { demoMode: demoModeArg });
  const createDivision = useMutation(api.divisions.create);
  const updateDivision = useMutation(api.divisions.update);
  const removeDivision = useMutation(api.divisions.remove);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"divisions"> | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (currentUser && !isAdminOrManager && !isDemoGuest) {
      toast.error("Only admins and managers can manage divisions");
      navigate("/dashboard");
    }
  }, [currentUser, isAdminOrManager, isDemoGuest, navigate]);

  if (!divisions || (!currentUser && !isDemoGuest)) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!isAdminOrManager && !isDemoGuest) return null;

  const openCreate = () => {
    setName("");
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (division: (typeof divisions)[number]) => {
    setName(division.name);
    setEditingId(division._id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a division name");
      return;
    }
    try {
      if (editingId) {
        await updateDivision({ id: editingId, name: name.trim() });
        toast.success("Division updated");
      } else {
        await createDivision({ name: name.trim() });
        toast.success("Division created");
      }
      setDialogOpen(false);
      setName("");
      setEditingId(null);
    } catch {
      toast.error("Failed to save division");
    }
  };

  const handleDelete = async (id: Id<"divisions">) => {
    try {
      await removeDivision({ id });
      toast.success("Division deleted");
    } catch {
      toast.error("Failed to delete division");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Divisions</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational divisions
          </p>
        </div>
        {!isDemoGuest && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" />
                New Division
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Division" : "New Division"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Division Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Engineering"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Update Division" : "Create Division"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {divisions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>No divisions yet</EmptyTitle>
            <EmptyDescription>
              Create divisions to organize tasks by department
            </EmptyDescription>
          </EmptyHeader>
          {!isDemoGuest && (
            <EmptyContent>
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" />
                New Division
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Division Name</TableHead>
                {!isDemoGuest && (
                  <TableHead className="font-semibold w-24">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  {!isDemoGuest && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(d)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(d._id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
