import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
import { Plus, Pencil, Trash2, Megaphone, ChevronRight, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function CampaignListInner() {
  const campaigns = useQuery(api.adProfit.listCampaigns, {});
  const createCampaign = useMutation(api.adProfit.createCampaign);
  const updateCampaign = useMutation(api.adProfit.updateCampaign);
  const deleteCampaign = useMutation(api.adProfit.deleteCampaign);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"adProfitCampaigns"> | null>(null);
  const [name, setName] = useState("");
  const [ppnRate, setPpnRate] = useState("11");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (campaigns === undefined) {
    return (
      <div className="p-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const openCreate = () => {
    setEditId(null);
    setName("");
    setPpnRate("11");
    setDialogOpen(true);
  };

  const openEdit = (id: Id<"adProfitCampaigns">, n: string, ppn: number) => {
    setEditId(id);
    setName(n);
    setPpnRate(String(ppn));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama kampanye wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateCampaign({ id: editId, name: name.trim(), ppnRate: parseFloat(ppnRate) || 11 });
        toast.success("Kampanye diperbarui");
      } else {
        await createCampaign({ name: name.trim(), ppnRate: parseFloat(ppnRate) || 11 });
        toast.success("Kampanye ditambahkan");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"adProfitCampaigns">) => {
    try {
      await deleteCampaign({ id });
      toast.success("Kampanye dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-sm font-bold">Daftar Kampanye</h2>
          <p className="text-[11px] text-muted-foreground">{campaigns.length} kampanye</p>
        </div>
        <Button onClick={openCreate} size="sm" className="cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="px-4 space-y-2 pb-6">
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Belum ada kampanye. Tambahkan kampanye untuk mulai menghitung profit.
          </p>
        ) : (
          campaigns.map((c) => (
            <div
              key={c._id}
              className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4 text-orange-600" />
              </div>
              <button
                onClick={() => navigate(`/ad-profit/${c._id}`)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <p className="text-sm font-bold truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">PPN: {c.ppnRate}%</p>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c._id, c.name, c.ppnRate);
                  }}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 cursor-pointer hover:opacity-70"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c._id);
                  }}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 cursor-pointer hover:opacity-70"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate(`/ad-profit/${c._id}`)}
                  className="p-2 text-muted-foreground cursor-pointer hover:text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report link */}
      <div className="px-4 pb-6">
        <Button
          onClick={() => navigate("/ad-profit/report")}
          className="w-full cursor-pointer"
          size="lg"
        >
          Laporan Profit Harian
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Kampanye" : "Tambah Kampanye"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kampanye</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="contoh: Iklan Wakaf WQ + HI"
                className="mt-1"
              />
            </div>
            <div>
              <Label>PPN Rate (%)</Label>
              <Input
                type="number"
                value={ppnRate}
                onChange={(e) => setPpnRate(e.target.value)}
                placeholder="11"
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
    </>
  );
}

function RoleGate({ children }: { children: React.ReactNode }) {
  const { user, canAccessAdProfit } = useUserRole();
  const navigate = useNavigate();

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!canAccessAdProfit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 px-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <p className="text-muted-foreground text-sm">
            Halaman ini hanya dapat diakses oleh Admin dan Admin Iklan.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="cursor-pointer">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdProfitPage() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen">
          <Skeleton className="h-8 w-64" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 px-6">
            <h2 className="text-2xl font-bold">Ad Profit Calculator</h2>
            <p className="text-muted-foreground">Silahkan login untuk mengakses.</p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <RoleGate>
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-2">
              <h1 className="text-2xl font-bold">Profit Iklan</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Kelola kampanye dan hitung profit iklan
              </p>
            </div>
            <CampaignListInner />
          </div>
        </RoleGate>
      </Authenticated>
    </>
  );
}
