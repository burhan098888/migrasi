import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
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
import { Switch } from "@/components/ui/switch.tsx";
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
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/currency.ts";

type DialogMode =
  | { type: "add" }
  | { type: "edit"; bill: Doc<"adRecurringBills"> }
  | null;

type Props = {
  calculationId: Id<"adCalculations">;
  bills: Doc<"adRecurringBills">[];
};

export default function RecurringBillSection({
  calculationId,
  bills,
}: Props) {
  const addBill = useMutation(api.adCalculations.addRecurringBill);
  const updateBill = useMutation(api.adCalculations.updateRecurringBill);
  const removeBill = useMutation(api.adCalculations.removeRecurringBill);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("4");
  const [isActive, setIsActive] = useState(true);
  const [deleteId, setDeleteId] = useState<Id<"adRecurringBills"> | null>(
    null,
  );

  const totalMonthly = bills
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + b.amount, 0);

  const openDialog = (mode: DialogMode) => {
    if (mode?.type === "edit") {
      setDescription(mode.bill.description);
      setAmount(String(mode.bill.amount));
      setDayOfMonth(String(mode.bill.dayOfMonth));
      setIsActive(mode.bill.isActive);
    } else {
      setDescription("");
      setAmount("");
      setDayOfMonth("4");
      setIsActive(true);
    }
    setDialogMode(mode);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error("Keterangan harus diisi");
      return;
    }
    const amountNum = Math.round(Number(amount));
    if (!amountNum || amountNum <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    const day = Number(dayOfMonth);
    if (!day || day < 1 || day > 31) {
      toast.error("Tanggal harus antara 1-31");
      return;
    }

    try {
      if (dialogMode?.type === "edit") {
        await updateBill({
          id: dialogMode.bill._id,
          description: description.trim(),
          amount: amountNum,
          dayOfMonth: day,
          isActive,
        });
        toast.success("Tagihan berhasil diperbarui");
      } else {
        await addBill({
          calculationId,
          description: description.trim(),
          amount: amountNum,
          dayOfMonth: day,
          isActive,
        });
        toast.success("Tagihan berhasil ditambahkan");
      }
      setDialogMode(null);
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Gagal menyimpan data");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeBill({ id: deleteId });
      toast.success("Tagihan berhasil dihapus");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Gagal menghapus data");
      }
    }
    setDeleteId(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-base font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Biaya Berulang
            </CardTitle>
          </div>
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={() => openDialog({ type: "add" })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Belum ada tagihan berulang
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-center">Tgl</TableHead>
                    <TableHead className="text-right">Jumlah/Bulan</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill, i) => (
                    <TableRow key={bill._id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{bill.description}</TableCell>
                      <TableCell className="text-center">
                        {bill.dayOfMonth}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(bill.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={bill.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {bill.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() =>
                              openDialog({ type: "edit", bill })
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer text-destructive"
                            onClick={() => setDeleteId(bill._id)}
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

          {/* Monthly total */}
          {bills.length > 0 && (
            <div className="mt-4 flex justify-between items-center px-4 py-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <span className="font-bold text-amber-800 dark:text-amber-300">
                Total Bulanan (Aktif)
              </span>
              <span className="font-bold font-mono text-amber-800 dark:text-amber-300">
                {formatRupiah(totalMonthly)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode?.type === "edit" ? "Edit" : "Tambah"} Tagihan
              Berulang
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Keterangan</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Centang Biru Fanpage & Instagram"
              />
            </div>
            <div>
              <Label>Jumlah per Bulan (Rp)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="357388"
              />
            </div>
            <div>
              <Label>Tanggal Tagihan (1-31)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                id="bill-active"
              />
              <Label htmlFor="bill-active" className="cursor-pointer">
                Tagihan aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setDialogMode(null)}
            >
              Batal
            </Button>
            <Button className="cursor-pointer" onClick={handleSave}>
              Simpan
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
            <AlertDialogTitle>Hapus Tagihan Berulang?</AlertDialogTitle>
            <AlertDialogDescription>
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
    </>
  );
}
