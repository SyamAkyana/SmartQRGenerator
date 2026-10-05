"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MultiLinkItem {
  _tempId?: string;
  id?: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
}

interface PageData {
  id: string;
  title: string | null;
  description: string | null;
  theme: string;
  items: Array<{
    id: string;
    label: string;
    url: string;
    icon: string | null;
    sortOrder: number;
    enabled: boolean;
  }>;
}

interface MultiLinkEditorProps {
  qrId: string;
}

const THEMES = [
  { value: "default", label: "Default", description: "White background with borders" },
  { value: "minimal", label: "Minimal", description: "Clean and simple" },
  { value: "dark", label: "Dark", description: "Dark background" },
];

let tempIdCounter = 0;
function makeTempId() {
  return `temp_${++tempIdCounter}`;
}

export function MultiLinkEditor({ qrId }: MultiLinkEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // Page metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("default");

  // Items
  const [items, setItems] = useState<MultiLinkItem[]>([]);
  const dirtyRef = useRef(false);

  function markDirty() {
    dirtyRef.current = true;
    setSaved(false);
  }

  // Fetch page data. Ignore the response if the user has already edited, so a
  // slow initial GET (or React Strict Mode's overlapping fetch) cannot wipe
  // in-progress changes or a just-completed save.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/multi-link/${qrId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || dirtyRef.current) return;
        if (data.success && data.data?.page) {
          const page: PageData = data.data.page;
          setPageId(page.id);
          setTitle(page.title ?? "");
          setDescription(page.description ?? "");
          setTheme(page.theme ?? "default");
          setItems(
            page.items.map((item) => ({
              id: item.id,
              label: item.label,
              url: item.url,
              icon: item.icon ?? "",
              enabled: item.enabled,
            }))
          );
        } else if (data.success && !data.data?.page) {
          // Page might not exist yet — that's fine for new QRs
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load page data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qrId]);

  function addItem() {
    markDirty();
    setItems((prev) => [
      ...prev,
      { _tempId: makeTempId(), label: "", url: "", icon: "", enabled: true },
    ]);
  }

  function removeItem(index: number) {
    markDirty();
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof MultiLinkItem, value: string | boolean) {
    markDirty();
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    markDirty();
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Validate items
      for (const item of items) {
        if (!item.label.trim()) {
          setError("All links must have a label.");
          setSaving(false);
          return;
        }
        if (!item.url.trim()) {
          setError("All links must have a URL.");
          setSaving(false);
          return;
        }
        try {
          const parsedUrl = new URL(item.url.trim());
          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            setError(`"${item.url}" has a forbidden protocol. Only http:// and https:// URLs are allowed.`);
            setSaving(false);
            return;
          }
        } catch {
          setError(`"${item.url}" is not a valid URL.`);
          setSaving(false);
          return;
        }
      }

      // 1. Save page metadata
      const pageRes = await fetch(`/api/multi-link/${qrId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          theme,
        }),
      });
      const pageData = await pageRes.json();
      if (!pageData.success) {
        setError(pageData.error?.message ?? "Failed to save page.");
        setSaving(false);
        return;
      }

      // Store pageId if we got one back
      if (pageData.data?.page?.id) {
        setPageId(pageData.data.page.id);
      }

      // 2. Save items
      const itemsRes = await fetch(`/api/multi-link/${qrId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item, index) => ({
            id: item.id,
            label: item.label.trim(),
            url: item.url.trim(),
            icon: item.icon.trim() || null,
            sortOrder: index,
            enabled: item.enabled,
          })),
        }),
      });
      const itemsData = await itemsRes.json();
      if (!itemsData.success) {
        setError(itemsData.error?.message ?? "Failed to save items.");
        setSaving(false);
        return;
      }

      // Update items with server IDs for new items
      if (itemsData.data?.items) {
        setItems((prev) =>
          prev.map((item, i) => ({
            ...item,
            id: itemsData.data.items[i]?.id ?? item.id,
          }))
        );
      }

      setSaved(true);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 py-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Page Metadata */}
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Page Title</label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            placeholder="My Links"
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            placeholder="Add a short description..."
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Theme</label>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  markDirty();
                }}
                className={cn(
                  "flex-1 p-3 rounded-lg border text-left transition-colors",
                  theme === t.value
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                )}
              >
                <p className="text-sm font-medium text-neutral-900">{t.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200" />

      {/* Links Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">
            Links ({items.length})
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-300 rounded-lg">
            <Link2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No links yet. Add your first link above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item._tempId ?? item.id ?? index}
                className="border border-neutral-200 rounded-lg p-3 bg-white space-y-3"
              >
                <div className="flex items-start gap-2">
                  {/* Drag handle visual */}
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-neutral-100 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      className="p-0.5 rounded hover:bg-neutral-100 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>

                  <div className="flex-1 grid gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => updateItem(index, "label", e.target.value)}
                          placeholder="Link label"
                          maxLength={100}
                          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="text"
                          value={item.icon}
                          onChange={(e) => updateItem(index, "icon", e.target.value)}
                          placeholder="Icon"
                          maxLength={10}
                          className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          title="Emoji or icon"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateItem(index, "url", e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => updateItem(index, "enabled", e.target.checked)}
                          className="rounded border-neutral-300"
                        />
                        Enabled
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 mt-1"
                    title="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-32">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            "Saved!"
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}