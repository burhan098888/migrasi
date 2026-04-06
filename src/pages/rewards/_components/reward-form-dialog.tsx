import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ConvexError } from "convex/values";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type FormData = {
  userId: string;
  type: "reward" | "punishment";
  amount: string;
  description: string;
  date: string;
};

const INITIAL_FORM: FormData = {
  userId: "",
  type: "reward",
  amount: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

type RewardFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RewardFormDialog({
  open,
  onOpenChange,
}: RewardFormDialogProps) {
  const { demoModeArg } = useDemoMode();
  const users = useQuery(api.users.listAll, { demoMode: demoModeArg });
  const createRecord = useMutation(api.rewardPunishments.create);

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setSubmitted(true);
    const missingFields: string[] = [];
    if (!form.userId) missingFields.push("Staff Member");
    if (!form.amount || parseFloat(form.amount) === 0) missingFields.push("Jumlah Ayat");
    if (!form.description.trim()) missingFields.push("Description");
    if (!form.date) missingFields.push("Date");

    if (missingFields.length > 0) {
      toast.error(`Missing: ${missingFields.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const rawAmount = Math.abs(parseFloat(form.amount));
      const finalAmount = form.type === "punishment" ? -rawAmount : rawAmount;

      await createRecord({
        userId: form.userId as Id<"users">,
        amount: finalAmount,
        description: form.description,
        date: new Date(form.date).toISOString(),
      });
      toast.success(
        form.type === "punishment"
          ? "Punishment recorded — ayat Al-Quran harus dibaca"
          : "Reward (tabungan akhirat) recorded",
      );
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { code: string; message: string };
        toast.error(data.message || "Failed to save record");
      } else {
        toast.error("Failed to save record");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fieldError = (value: string) =>
    submitted && !value ? "border-destructive ring-destructive/20 ring-2" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Reward / Punishment</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Jumlah ayat Al-Quran yang harus dibaca. Reward = tabungan akhirat.
          Punishment = wajib baca ayat sejumlah tersebut.
        </p>
        <div className="space-y-4 pt-2">
          {/* Staff Member */}
          <div>
            <Label>
              Staff Member <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.userId || undefined}
              onValueChange={(val) => updateField("userId", val)}
            >
              <SelectTrigger className={fieldError(form.userId)}>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name ?? u.email ?? "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div>
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(val) =>
                updateField("type", val as "reward" | "punishment")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reward">
                  Tabungan Akhirat (Reward)
                </SelectItem>
                <SelectItem value="punishment">Punishment (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verse Count */}
          <div>
            <Label>
              Jumlah Ayat <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="e.g. 5"
              className={fieldError(form.amount)}
            />
          </div>

          {/* Date */}
          <div>
            <Label>
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={fieldError(form.date)}
            />
          </div>

          {/* Description */}
          <div>
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Reason for reward or punishment..."
              rows={3}
              className={fieldError(form.description.trim())}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
