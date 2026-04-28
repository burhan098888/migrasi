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
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function formatNum(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export default function AdProfitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaignId = id as Id<"adProfitCampaigns">;

  const campaign = useQuery(api.adProfit.getCampaign, { id: campaignId });
  const entries = useQuery(api.adProfit.listEntries, { campaignId });
  const createEntry = useMutation(api.adProfit.createEntry);
  const updateEntry = useMutation(api.adProfit.updateEntry);
  const deleteEntry = useMutation(api.adProfit.deleteEntry);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"adProfitEntries"> | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [adSpend, setAdSpend] = useState("");
  const [leads, setLeads] = useState("");
  const [donation, setDonation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (campaign === undefined || entries === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Kampanye tidak ditemukan</p>
        <Button onClick={() => navigate("/ad-profit")} className="mt-4 cursor-pointer">
          Kembali
        </Button>
      </div>
    );
  }

  const ppnRate = campaign.ppnRate;

  // Summary
  const totalAdSpend = entries.reduce((s, e) => s + e.adSpend, 0);
  const totalLeads = entries.reduce((s, e) => s + e.leads, 0);
  const totalDonation = entries.reduce((s, e) => s + e.donation, 0);
  const totalBiayaPpn = totalAdSpend * (1 + ppnRate / 100);
  const totalProfit = totalDonation - totalBiayaPpn;

  const openCreate = () => {
    setEditId(null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setAdSpend("");
    setLeads("");
    setDonation("");
    setNotes("");
    setDialogOpen(true);
  };

  const openEdit = (entry: (typeof entries)[number]) => {
    setEditId(entry._id);
    setDate(entry.date);
    setAdSpend(String(entry.adSpend));
    setLeads(String(entry.leads));
    setDonation(String(entry.donation));
    setNotes(entry.notes ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        date,
        adSpend: parseFloat(adSpend) || 0,
        leads: parseInt(leads) || 0,
        donation: parseFloat(donation) || 0,
        ...(notes ? { notes } : {}),
      };
      if (editId) {
        await updateEntry({ id: editId, ...data });
        toast.success("Entry diperbarui");
      } else {
        await createEntry({ campaignId, ...data });
        toast.success("Entry ditambahkan");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: Id<"adProfitEntries">) => {
    try {
      await deleteEntry({ id: entryId });
      toast.success("Entry dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/ad-profit")} className="cursor-pointer hover:opacity-70">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{campaign.name}</h1>
          <p className="text-xs text-muted-foreground">PPN: {ppnRate}%</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Leads</p>
          <p className="text-lg font-bold mt-1">{formatNum(totalLeads)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Biaya + PPN</p>
          <p className="text-lg font-bold mt-1 text-red-600">Rp {formatNum(totalBiayaPpn)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Donasi</p>
          <p className="text-lg font-bold mt-1 text-green-600">Rp {formatNum(totalDonation)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Profit</p>
          <p className={`text-lg font-bold mt-1 ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalProfit < 0 ? "-" : ""}Rp {formatNum(Math.abs(totalProfit))}
          </p>
        </div>
      </div>

      {/* Entries */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Data Harian</h2>
        <Button onClick={openCreate} size="sm" className="cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Belum ada data</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const biaya = entry.adSpend * (1 + ppnRate / 100);
            const profit = entry.donation - biaya;
            return (
              <div
                key={entry._id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground">{entry.date}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1.5 text-sm">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Leads</span>
                      <p className="font-semibold">{entry.leads}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Biaya+PPN</span>
                      <p className="font-semibold text-red-600">Rp {formatNum(biaya)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Donasi</span>
                      <p className="font-semibold text-green-600">Rp {formatNum(entry.donation)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Profit</span>
                      <p className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {profit < 0 ? "-" : ""}Rp {formatNum(Math.abs(profit))}
                      </p>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-[11px] text-muted-foreground mt-1">{entry.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={() => openEdit(entry)}
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 cursor-pointer hover:opacity-70"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 cursor-pointer hover:opacity-70"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Entry" : "Tambah Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Ad Spend (sebelum PPN)</Label>
              <Input
                type="number"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Jumlah Leads</Label>
              <Input
                type="number"
                value={leads}
                onChange={(e) => setLeads(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Donasi / Income</Label>
              <Input
                type="number"
                value={donation}
                onChange={(e) => setDonation(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
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
