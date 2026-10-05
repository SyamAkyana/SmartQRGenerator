"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import type { StoredFileRecord } from "@/lib/file/service";

interface FilesListProps {
  initialFiles: StoredFileRecord[];
  totalCount: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesList({ initialFiles, totalCount }: FilesListProps) {
  const [files, setFiles] = useState<StoredFileRecord[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch("/api/file", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => [data.data.file, ...prev]);
      } else {
        alert(data.error?.message ?? "Upload failed");
      }
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setPendingDeleteId(id);
    try {
      const res = await fetch(`/api/file/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Files</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {totalCount === 0 ? "No files uploaded yet" : `${totalCount} file${totalCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Upload File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.docx,.xlsx,.pptx"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Allowed types hint */}
      <p className="text-xs text-neutral-400">
        Accepted: PDF, PNG, JPG, WebP, GIF, TXT, DOCX, XLSX, PPTX — max 10 MB
      </p>

      {/* Empty state */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-300 rounded-xl bg-white">
          <div className="p-4 bg-neutral-100 rounded-full mb-4">
            <FileText className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">No files yet</h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-xs">
            Upload a file to link it to a FILE QR code.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="w-[260px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium text-neutral-900 max-w-[260px] truncate flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="truncate">{file.originalName}</span>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-600">{file.mimeType}</TableCell>
                  <TableCell className="text-right text-sm text-neutral-500 tabular-nums">
                    {formatSize(file.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {new Date(file.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/file/${file.id}`}
                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        download
                      >
                        Download
                      </a>
                      {pendingDeleteId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:text-red-600"
                          onClick={() => handleDelete(file.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}