import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, Pencil, Trash2, Tag, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function FinanceCategoriesPage() {
  const categories = useQuery(api.finance.listCategories, {});
  const createCategory = useMutation(api.finance.createCategory);
  const updateCategory = useMutation(api.finance.updateCategory);
  const deleteCategory = useMutation(api.finance.deleteCategory);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"financeCategories"> | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (categories === undefined) {
    return (
      <div>
        <div className="bg-amber-600 text-white px-5 pt-6 pb-6 flex items-center gap-3">
          <Skeleton className="h-6 w-6 bg-white/20" />
          <Skeleton className="h-6 w-40 bg-white/20" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditId(null);
    setName("");
    setType("expense");
    setDialogOpen(true);
  };

  const openEdit = (id: Id<"financeCategories">, n: string, t: "income" | "expense") => {
    setEditId(id);
    setName(n);
    setType(t);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateCategory({ id: editId, name: name.trim(), type });
        toast.success("Kategori diperbarui");
      } else {
        await createCategory({ name: name.trim(), type });
        toast.success("Kategori ditambahkan");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"financeCategories">) => {
    try {
      await deleteCategory({ id });
      toast.success("Kategori dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-amber-600 text-white px-5 pt-6 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/finance/menu")} className="cursor-pointer hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Kelola Kategori</h1>
            <p className="text-xs opacity-80">Daftar item</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-white text-amber-700 hover:bg-white/90 cursor-pointer font-bold"
        >
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs font-bold text-muted-foreground mb-3">Daftar Saat Ini</p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Belum ada kategori</p>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c._id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c._id, c.name, c.type)}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kategori</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="contoh: MAKAN" className="mt-1" />
            </div>
            <div>
              <Label>Tipe</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
