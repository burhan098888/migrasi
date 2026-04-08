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
import { Switch } from "@/components/ui/switch.tsx";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/currency.ts";

type DialogMode =
  | { type: "add" }
  | { type: "edit"; entry: Doc<"adResultEntries"> }
  | null;

type Props = {
  calculationId: Id<"adCalculations">;
  entries: Doc<"adResultEntries">[];
};

export default function ResultSection({ calculationId, entries }: Props) {
  const addResult = useMutation(api.adCalculations.addResult);
  const updateResult = useMutation(api.adCalculations.updateResult);
  const removeResult = useMutation(api.adCalculations.removeResult);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [isMonetary, setIsMonetary] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"adResultEntries"> | null>(
    null,
  );

  const openDialog = (mode: DialogMode) => {
    if (mode?.type === "edit") {
      setLabel(mode.entry.label);
      setValue(String(mode.entry.value));
      setIsMonetary(mode.entry.isMonetary);
    } else {
      setLabel("");
      setValue("");
      setIsMonetary(false);
    }
    setDialogMode(mode);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error("Label harus diisi");
      return;
    }
    const valueNum = Number(value);
    if (isNaN(valueNum)) {
      toast.error("Nilai harus berupa angka");
      return;
    }

    try {
      if (dialogMode?.type === "edit") {
        await updateResult({
          id: dialogMode.entry._id,
          label: label.trim(),
          value: valueNum,
          isMonetary,
        });
        toast.success("Hasil berhasil diperbarui");
      } else {
        await addResult({
          calculationId,
          label: label.trim(),
          value: valueNum,
          isMonetary,
        });
        toast.success("Hasil berhasil ditambahkan");
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
      await removeResult({ id: deleteId });
      toast.success("Hasil berhasil dihapus");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Gagal menghapus data");
      }
    }
    setDeleteId(null);
  };

  const formatValue = (val: number, monetary: boolean) => {
    if (monetary) return formatRupiah(val);
    return new Intl.NumberFormat("id-ID").format(val);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Hasil
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
              Belum ada data hasil
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, i) => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{entry.label}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatValue(entry.value, entry.isMonetary)}
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
              {dialogMode?.type === "edit" ? "Edit" : "Tambah"} Hasil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ikuti atau Suka"
              />
            </div>
            <div>
              <Label>Nilai</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="200925"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isMonetary}
                onCheckedChange={setIsMonetary}
                id="is-monetary"
              />
              <Label htmlFor="is-monetary" className="cursor-pointer">
                Tampilkan sebagai Rupiah (Rp)
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
            <AlertDialogTitle>Hapus Hasil?</AlertDialogTitle>
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
