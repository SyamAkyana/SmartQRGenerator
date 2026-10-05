"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateQrDialog } from "./create-qr-dialog";
import { DeleteQrDialog } from "./delete-qr-dialog";
import { EditQrDialog } from "./edit-qr-dialog";
import { DownloadQrDialog } from "./download-qr-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Copy, Trash2, Power, PowerOff, ExternalLink, Loader2, BarChart3, Link2, Download } from "lucide-react";
import Link from "next/link";
import type { QRCodeRecord } from "@/lib/qr/service";
import { cn } from "@/lib/utils";

interface QrListProps {
  initialQrs: QRCodeRecord[];
  totalCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  URL: "URL",
  MAP: "Map",
  PHONE: "Phone",
  EMAIL: "Email",
  CONTACT: "Contact",
  WHATSAPP: "WhatsApp",
  WIFI: "Wi-Fi",
  TEXT: "Text",
  FILE: "File",
  MULTI_LINK: "Multi-Link",
};

const TYPE_COLORS: Record<string, string> = {
  URL: "bg-blue-100 text-blue-700 border-blue-200",
  MAP: "bg-green-100 text-green-700 border-green-200",
  PHONE: "bg-purple-100 text-purple-700 border-purple-200",
  EMAIL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONTACT: "bg-pink-100 text-pink-700 border-pink-200",
  WHATSAPP: "bg-green-100 text-green-700 border-green-200",
  WIFI: "bg-neutral-100 text-neutral-700 border-neutral-200",
  TEXT: "bg-orange-100 text-orange-700 border-orange-200",
  FILE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  MULTI_LINK: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISABLED: "bg-neutral-100 text-neutral-600 border-neutral-300",
  EXPIRED: "bg-red-50 text-red-700 border-red-200",
};

function QrRow({
  qr,
  pending,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
  onDownload,
}: {
  qr: QRCodeRecord;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDownload: () => void;
}) {
  const isActive = qr.status === "ACTIVE";

  return (
    <TableRow>
      <TableCell className="font-medium text-neutral-900 max-w-[200px] truncate">
        {qr.name}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", TYPE_COLORS[qr.type] ?? "bg-gray-100 text-gray-700")}
        >
          {TYPE_LABELS[qr.type] ?? qr.type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", STATUS_COLORS[qr.status] ?? "bg-gray-100")}
        >
          {qr.status.charAt(0) + qr.status.slice(1).toLowerCase()}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono">
            {qr.shortCode}
          </span>
          <a
            href={`/q/${qr.shortCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-neutral-700"
            title="Open public QR"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm font-medium tabular-nums">
        <span className="text-neutral-500">
          {qr.scanCount ?? 0}
        </span>
        <a
          href={`/dashboard/qr/${qr.id}/analytics`}
          className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800"
          title="View analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </a>
      </TableCell>
      <TableCell className="text-xs text-neutral-500">
        {new Date(qr.createdAt).toLocaleDateString("en-US")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onDownload}
                title="Download"
                data-testid={`download-qr-${qr.id}`}
              >
                <Download className="w-4 h-4 text-neutral-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onToggle}
                title={isActive ? "Disable QR" : "Enable QR"}
              >
                {isActive ? (
                  <PowerOff className="w-4 h-4 text-amber-600" />
                ) : (
                  <Power className="w-4 h-4 text-emerald-600" />
                )}
              </Button>
              {qr.type === "MULTI_LINK" && (
                <Link
                  href={`/dashboard/qr/${qr.id}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                  title="Edit Links"
                >
                  <Link2 className="w-4 h-4" />
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onDuplicate}
                title="Duplicate"
              >
                <Copy className="w-4 h-4 text-neutral-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onEdit}
                title="Edit"
              >
                <Pencil className="w-4 h-4 text-neutral-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:text-red-600"
                onClick={onDelete}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function QrList({ initialQrs, totalCount }: QrListProps) {
  const router = useRouter();
  const [qrs, setQrs] = useState<QRCodeRecord[]>(initialQrs);
  const [createOpen, setCreateOpen] = useState(false);
  const [editQr, setEditQr] = useState<QRCodeRecord | null>(null);
  const [deleteQr, setDeleteQr] = useState<QRCodeRecord | null>(null);
  const [downloadQr, setDownloadQr] = useState<QRCodeRecord | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleCreateSuccess(newQr: QRCodeRecord) {
    setQrs((prev) => [newQr, ...prev]);
    setCreateOpen(false);
    // Redirect to the links editor for newly created MULTI_LINK QR codes
    if (newQr.type === "MULTI_LINK") {
      router.push(`/dashboard/qr/${newQr.shortCode}`);
    }
  }

  function handleEditSuccess(updatedQr: QRCodeRecord) {
    setQrs((prev) => prev.map((q) => (q.id === updatedQr.id ? updatedQr : q)));
    setEditQr(null);
  }

  function handleDeleteSuccess(id: string) {
    setQrs((prev) => prev.filter((q) => q.id !== id));
    setDeleteQr(null);
  }

  async function handleDuplicate(qrId: string) {
    setPendingId(qrId);
    try {
      const res = await fetch(`/api/qr/${qrId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.data?.qr) {
        setQrs((prev) => [data.data.qr, ...prev]);
      }
    } finally {
      setPendingId(null);
    }
    // Don't call router.refresh() here — it would wipe the optimistic state update
  }

  async function handleToggle(qrId: string, currentStatus: string) {
    setPendingId(qrId);
    const action = currentStatus === "ACTIVE" ? "disable" : "enable";
    try {
      const res = await fetch(`/api/qr/${qrId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.data?.qr) {
        setQrs((prev) => prev.map((q) => (q.id === qrId ? data.data.qr : q)));
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">QR Codes</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {totalCount === 0 ? "No QR codes yet" : `${totalCount} QR code${totalCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create QR Code
        </Button>
      </div>

      {/* Empty state */}
      {qrs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-300 rounded-xl bg-white">
          <div className="p-4 bg-neutral-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">No QR codes yet</h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-xs">
            Create your first QR code to get started with dynamic, editable QR codes.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create QR Code
          </Button>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Short Code</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrs.map((qr) => (
                <QrRow
                  key={qr.id}
                  qr={qr}
                  pending={pendingId === qr.id}
                  onEdit={() => setEditQr(qr)}
                  onDelete={() => setDeleteQr(qr)}
                  onDuplicate={() => handleDuplicate(qr.id)}
                  onToggle={() => handleToggle(qr.id, qr.status)}
                  onDownload={() => setDownloadQr(qr)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <CreateQrDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />
      <EditQrDialog
        key={editQr?.id ?? "closed"}
        qr={editQr}
        onOpenChange={(open) => !open && setEditQr(null)}
        onSuccess={handleEditSuccess}
      />
      <DeleteQrDialog
        qr={deleteQr}
        onOpenChange={(open) => !open && setDeleteQr(null)}
        onSuccess={handleDeleteSuccess}
      />
      <DownloadQrDialog
        key={downloadQr?.id ?? "download-closed"}
        qr={downloadQr}
        onOpenChange={(open) => !open && setDownloadQr(null)}
      />
    </div>
  );
}
