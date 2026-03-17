import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
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
import { toast } from "sonner";
import { format } from "date-fns";

type HolidayDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
};

export default function HolidayDialog({ open, onClose, defaultDate }: HolidayDialogProps) {
  const createHoliday = useMutation(api.holidays.create);
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState(defaultDate ? format(defaultDate, "yyyy-MM-dd") : "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !date) return;
    setSaving(true);
    try {
      await createHoliday({ date, eventName: eventName.trim() });
      toast.success("Holiday added");
      setEventName("");
      setDate("");
      onClose();
    } catch {
      toast.error("Failed to add holiday");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Holiday / Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="holiday-name">Event Name</Label>
            <Input
              id="holiday-name"
              placeholder="e.g. Independence Day"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="holiday-date">Date</Label>
            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !eventName.trim() || !date}>
              {saving ? "Saving..." : "Add Holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
