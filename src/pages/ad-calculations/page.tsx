import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ConvexError } from "convex/values";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/currency.ts";
import { toast } from "sonner";

function ListContent() {
  const navigate = useNavigate();
  const calcs = useQuery(api.adCalculations.getAll, {});
  const createCalc = useMutation(api.adCalculations.create);
  const removeCalc = useMutation(api.adCalculations.remove);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [ppnRate, setPpnRate] = useState("11");
  const [deleteId, setDeleteId] = useState<Id<"adCalculations"> | null>(null);

  if (calcs === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Nama fanpage harus diisi");
      return;
    }
    try {
      const id = await createCalc({
        name: name.trim(),
        ppnRate: Number(ppnRate) || 11,
      });
      toast.success("Perhitungan berhasil dibuat");
      setShowCreate(false);
      setName("");
      setPpnRate("11");
      navigate(`/ad-calculations/${id}`);
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Gagal membuat perhitungan");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeCalc({ id: deleteId });
      toast.success("Perhitungan berhasil dihapus");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Gagal menghapus perhitungan");
      }
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perhitungan Iklan</h1>
          <p className="text-muted-foreground text-sm">
            Kelola perhitungan iklan fanpage
          </p>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Buat Baru
        </Button>
      </div>

      {/* Cards grid */}
      {calcs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calculator />
            </EmptyMedia>
            <EmptyTitle>Belum ada perhitungan</EmptyTitle>
            <EmptyDescription>
              Buat perhitungan iklan pertama untuk memulai
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Buat Perhitungan
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calcs.map((calc) => (
            <Card
              key={calc._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/ad-calculations/${calc._id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg truncate">{calc.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(calc._id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pemasukan</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    {formatRupiah(calc.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pengeluaran</span>
                  <span className="font-mono text-red-600 dark:text-red-400">
                    {formatRupiah(calc.totalPengeluaran)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-sm">
                  <span>Sisa</span>
                  <span
                    className={
                      calc.balance >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {calc.balance < 0 ? "-" : ""}
                    {formatRupiah(Math.abs(calc.balance))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perhitungan Iklan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Fanpage</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Eddy Wijaya"
              />
            </div>
            <div>
              <Label>PPN Rate (%)</Label>
              <Input
                type="number"
                value={ppnRate}
                onChange={(e) => setPpnRate(e.target.value)}
                placeholder="11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setShowCreate(false)}
            >
              Batal
            </Button>
            <Button className="cursor-pointer" onClick={handleCreate}>
              Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Perhitungan?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data pemasukan, pengeluaran, dan hasil akan ikut terhapus.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdCalculationsPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <ListContent />
      </Authenticated>
    </>
  );
}
