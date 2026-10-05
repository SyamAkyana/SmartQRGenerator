"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";

interface DeleteQrDialogProps {
  qr: QRCodeRecord | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string) => void;
}

export function DeleteQrDialog({ qr, onOpenChange, onSuccess }: DeleteQrDialogProps) {
  const [pending, setPending] = useState(false);
  const open = qr !== null;

  function handleConfirm() {
    if (!qr || pending) return;
    setPending(true);
    fetch(`/api/qr/${qr.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          onSuccess(qr.id);
          onOpenChange(false);
        }
      })
      .finally(() => {
        setPending(false);
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Delete QR Code
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{qr?.name}</strong>? This action cannot be
            undone, but you can recreate it at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending} className="gap-2">
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}