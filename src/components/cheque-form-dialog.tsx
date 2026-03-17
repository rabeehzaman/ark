"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChequeFormData {
  id?: string;
  date: string;
  chequeNumber: string;
  amount: string;
  status: "PENDING" | "CLEARED" | "BOUNCED";
  remarks: string;
  partyId: string;
}

interface ChequeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId: string;
  cheque?: ChequeFormData | null;
  onSuccess: () => void;
}

export function ChequeFormDialog({
  open,
  onOpenChange,
  partyId,
  cheque,
  onSuccess,
}: ChequeFormDialogProps) {
  const isEditing = !!cheque?.id;
  const [form, setForm] = useState<ChequeFormData>(
    cheque || {
      date: "",
      chequeNumber: "",
      amount: "",
      status: "PENDING",
      remarks: "",
      partyId,
    }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chequeNumber.trim() || !form.amount.trim()) {
      toast.error("Cheque number and amount are required");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/cheques/${cheque!.id}` : "/api/cheques";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: form.date || null,
          partyId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save cheque");
        return;
      }

      toast.success(isEditing ? "Cheque updated" : "Cheque added");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save cheque");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Cheque" : "Add Cheque"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chequeDate">Date</Label>
              <Input
                id="chequeDate"
                type="date"
                value={form.date ? form.date.split("T")[0] : ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeNumber">Cheque Number *</Label>
              <Input
                id="chequeNumber"
                value={form.chequeNumber}
                onChange={(e) =>
                  setForm({ ...form, chequeNumber: e.target.value })
                }
                placeholder="e.g. 000123"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chequeAmount">Amount *</Label>
              <Input
                id="chequeAmount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeStatus">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  v && setForm({
                    ...form,
                    status: v as "PENDING" | "CLEARED" | "BOUNCED",
                  })
                }
              >
                <SelectTrigger id="chequeStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CLEARED">Cleared</SelectItem>
                  <SelectItem value="BOUNCED">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chequeRemarks">Remarks</Label>
            <Textarea
              id="chequeRemarks"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional remarks"
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Cheque" : "Add Cheque"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
