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
import { format, parseISO } from "date-fns";

type DialogMode =
  | { type: "add" }
  | { type: "edit"; entry: Doc<"adIncomeEntries"> }
  | null;

type Props = {
  calculationId: Id<"adCalculations">;
  entries: Doc<"adIncomeEntries">[];
};

export default function IncomeSection({ calculationId, entries }: Props) {
  const addIncome = useMutation(api.adCalculations.addIncome);
  const updateIncome = useMutation(api.adCalculations.updateIncome);
  const removeIncome = useMutation(api.adCalculations.removeIncome);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteId, setDeleteId] = useState<Id<"adIncomeEntries"> | null>(
    null,
  );

  const sortedEntries = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  const openDialog = (mode: DialogMode) => {
    if (mode?.type === "edit") {
      setDate(mode.entry.date);
      setAmount(String(mode.entry.amount));
    } else {
      setDate("");
      setAmount("");
    }
    setDialogMode(mode);
  };

  const handleSave = async () => {
    if (!date) {
      toast.error("Tanggal harus diisi");
      return;
    }
    const amountNum = Math.round(Number(amount));
    if (!amountNum || amountNum <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    try {
      if (dialogMode?.type === "edit") {
        await updateIncome({
          id: dialogMode.entry._id,
          date,
          amount: amountNum,
        });
        toast.success("Pemasukan berhasil diperbarui");
      } else {
        await addIncome({ calculationId, date, amount: amountNum });
        toast.success("Pemasukan berhasil ditambahkan");
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
      await removeIncome({ id: deleteId });
      toast.success("Pemasukan berhasil dihapus");
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
          <CardTitle className="text-base font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
            Pemasukan
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
          {sortedEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Belum ada data pemasukan
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">
                      Jumlah Top Up
                    </TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry, i) => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>
                        {format(parseISO(entry.date), "dd/MM/yyyy")}
                      </TableCell>
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

          {/* Total row */}
          <div className="mt-4 flex justify-between items-center px-4 py-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <span className="font-bold text-green-800 dark:text-green-300">
              Total Pemasukan
            </span>
            <span className="font-bold font-mono text-green-800 dark:text-green-300">
              {formatRupiah(total)}
            </span>
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
              {dialogMode?.type === "edit" ? "Edit" : "Tambah"} Pemasukan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="3000000"
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
            <AlertDialogTitle>Hapus Pemasukan?</AlertDialogTitle>
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
