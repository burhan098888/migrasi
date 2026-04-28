import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, Pencil, Trash2, Wallet, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function FinanceWalletsPage() {
  const wallets = useQuery(api.finance.listWallets, {});
  const createWallet = useMutation(api.finance.createWallet);
  const updateWallet = useMutation(api.finance.updateWallet);
  const deleteWallet = useMutation(api.finance.deleteWallet);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"financeWallets"> | null>(null);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (wallets === undefined) {
    return (
      <div>
        <div className="bg-amber-600 text-white px-5 pt-6 pb-6 flex items-center gap-3">
          <Skeleton className="h-6 w-6 bg-white/20" />
          <Skeleton className="h-6 w-40 bg-white/20" />
        </div>
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditId(null);
    setName("");
    setInitialBalance("");
    setDialogOpen(true);
  };

  const openEdit = (id: Id<"financeWallets">, n: string, bal: number) => {
    setEditId(id);
    setName(n);
    setInitialBalance(String(bal));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama dompet wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateWallet({ id: editId, name: name.trim(), initialBalance: parseFloat(initialBalance) || 0 });
        toast.success("Dompet diperbarui");
      } else {
        await createWallet({ name: name.trim(), initialBalance: parseFloat(initialBalance) || 0 });
        toast.success("Dompet ditambahkan");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"financeWallets">) => {
    try {
      await deleteWallet({ id });
      toast.success("Dompet dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div>
      {/* Header - amber like screenshot */}
      <div className="bg-amber-600 text-white px-5 pt-6 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/finance/menu")} className="cursor-pointer hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Kelola Dompet</h1>
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
        {wallets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Belum ada dompet</p>
        ) : (
          <div className="space-y-2">
            {wallets.map((w) => (
              <div
                key={w._id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Saldo Awal: {new Intl.NumberFormat("id-ID").format(w.initialBalance)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(w._id, w.name, w.initialBalance)}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w._id)}
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
            <DialogTitle>{editId ? "Edit Dompet" : "Tambah Dompet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Dompet</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="contoh: Bank" className="mt-1" />
            </div>
            <div>
              <Label>Saldo Awal</Label>
              <Input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
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
