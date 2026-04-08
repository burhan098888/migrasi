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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/currency.ts";

type DialogMode =
  | { type: "add" }
  | { type: "edit"; entry: Doc<"adExpenseEntries"> }
  | null;

type Props = {
  calculationId: Id<"adCalculations">;
  entries: Doc<"adExpenseEntries">[];
  ppnRate: number;
};

export default function ExpenseSection({
  calculationId,
  entries,
  ppnRate,
}: Props) {
  const addExpense = useMutation(api.adCalculations.addExpense);
  const updateExpense = useMutation(api.adCalculations.updateExpense);
  const removeExpense = useMutation(api.adCalculations.removeExpense);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteId, setDeleteId] = useState<Id<"adExpenseEntries"> | null>(
    null,
  );

  const totalAdCost = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalPPN = Math.round(totalAdCost * (ppnRate / 100));
  const totalPengeluaran = totalAdCost + totalPPN;

  const openDialog = (mode: DialogMode) => {
    if (mode?.type === "edit") {
      setDescription(mode.entry.description);
      setAmount(String(mode.entry.amount));
    } else {
      setDescription("");
      setAmount("");
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

    try {
      if (dialogMode?.type === "edit") {
        await updateExpense({
          id: dialogMode.entry._id,
          description: description.trim(),
          amount: amountNum,
        });
        toast.success("Pengeluaran berhasil diperbarui");
      } else {
        await addExpense({
          calculationId,
          description: description.trim(),
          amount: amountNum,
        });
        toast.success("Pengeluaran berhasil ditambahkan");
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
      await removeExpense({ id: deleteId });
      toast.success("Pengeluaran berhasil dihapus");
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
          <CardTitle className="text-base font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
            Pengeluaran
          </CardTitle>
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
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Belum ada data pengeluaran
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Pengeluaran</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, i) => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatRupiah(entry.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() =>
                              openDialog({ type: "edit", entry })
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer text-destructive"
                            onClick={() => setDeleteId(entry._id)}
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

          {/* Calculated totals */}
          <div className="mt-4 space-y-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total biaya Iklan</span>
              <span className="font-mono">{formatRupiah(totalAdCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Biaya PPN {ppnRate}%
              </span>
              <span className="font-mono">{formatRupiah(totalPPN)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-800 dark:text-red-300 pt-1 border-t border-red-200 dark:border-red-900">
              <span>Total Pengeluaran</span>
              <span className="font-mono">
                {formatRupiah(totalPengeluaran)}
              </span>
            </div>
          </div>
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
              {dialogMode?.type === "edit" ? "Edit" : "Tambah"} Pengeluaran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Keterangan</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Biaya Thruplay"
              />
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000000"
              />
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
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
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
