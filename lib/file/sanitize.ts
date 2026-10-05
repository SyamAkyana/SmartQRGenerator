/**
 * Sanitize a user-provided filename for safe download/storage use.
 * This module intentionally has no server-only dependencies so it can be used
 * by client-side export helpers.
 */
export function sanitizeFilename(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? raw;
  if (!base || base === "") return "upload";

  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  let collapsed = cleaned;
  for (;;) {
    const next = collapsed.replace(/__+/g, "_").replace(/\.\.+/g, ".");
    if (next === collapsed) break;
    collapsed = next;
  }

  const dotIdx = collapsed.lastIndexOf(".");
  const hasExt = dotIdx > 0 && dotIdx < collapsed.length - 1;
  const ext = hasExt ? collapsed.slice(dotIdx) : "";
  const nameOnly = hasExt ? collapsed.slice(0, dotIdx) : collapsed;
  const MAX = 128;

  let result: string;
  if (ext) {
    const maxNameLen = Math.max(1, MAX - ext.length);
    let name = nameOnly.slice(0, maxNameLen);
    while (name.length > 0 && name.charCodeAt(name.length - 1) === 95) {
      name = name.slice(0, -1);
    }
    result = name + ext;
  } else {
    result = collapsed.slice(0, MAX) || "upload";
    while (result.length > 0 && result.charCodeAt(result.length - 1) === 95) {
      result = result.slice(0, -1);
    }
  }
  return result || "upload";
}
