"use server";

import { auth } from "@/auth";
import {
  createQr,
  deleteQr,
  disableQr,
  duplicateQr,
  enableQr,
  updateQr,
} from "@/lib/qr/service";
import { createQrSchema, updateQrSchema } from "@/lib/qr/types";
import { ActionResult } from "@/app/actions/auth";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function extractQrData(formData: FormData, type: string): Record<string, unknown> {
  const dataRaw = formData.get("data");
  if (typeof dataRaw === "string" && dataRaw.trim().startsWith("{")) {
    try {
      return JSON.parse(dataRaw);
    } catch {
      // fallback to field extraction
    }
  }

  const data: Record<string, unknown> = {};
  switch (type) {
    case "URL":
      if (formData.has("url")) data.url = (formData.get("url") as string)?.trim();
      break;
    case "PHONE":
      if (formData.has("phone")) data.phone = (formData.get("phone") as string)?.trim();
      break;
    case "EMAIL":
      if (formData.has("email")) data.email = (formData.get("email") as string)?.trim();
      if (formData.has("subject")) data.subject = (formData.get("subject") as string)?.trim();
      if (formData.has("body")) data.body = (formData.get("body") as string)?.trim();
      break;
    case "WHATSAPP":
      if (formData.has("phone")) data.phone = (formData.get("phone") as string)?.trim();
      if (formData.has("message")) data.message = (formData.get("message") as string)?.trim();
      break;
    case "MAP":
      if (formData.has("location")) data.location = (formData.get("location") as string)?.trim();
      if (formData.has("latitude") && formData.get("latitude")) data.latitude = Number(formData.get("latitude"));
      if (formData.has("longitude") && formData.get("longitude")) data.longitude = Number(formData.get("longitude"));
      break;
    case "TEXT":
      if (formData.has("text")) data.text = (formData.get("text") as string)?.trim();
      break;
    case "WIFI":
      if (formData.has("ssid")) data.ssid = (formData.get("ssid") as string)?.trim();
      if (formData.has("password")) data.password = (formData.get("password") as string)?.trim();
      if (formData.has("authType")) data.authType = (formData.get("authType") as string)?.trim() ?? "WPA";
      if (formData.has("hidden")) data.hidden = formData.get("hidden") === "true" || formData.get("hidden") === "on";
      break;
    case "CONTACT":
      if (formData.has("firstName")) data.firstName = (formData.get("firstName") as string)?.trim();
      if (formData.has("lastName")) data.lastName = (formData.get("lastName") as string)?.trim();
      if (formData.has("organization")) data.organization = (formData.get("organization") as string)?.trim();
      if (formData.has("jobTitle")) data.jobTitle = (formData.get("jobTitle") as string)?.trim();
      if (formData.has("phone")) data.phone = (formData.get("phone") as string)?.trim();
      if (formData.has("email")) data.email = (formData.get("email") as string)?.trim();
      if (formData.has("website")) data.website = (formData.get("website") as string)?.trim();
      if (formData.has("street")) data.street = (formData.get("street") as string)?.trim();
      if (formData.has("city")) data.city = (formData.get("city") as string)?.trim();
      if (formData.has("state")) data.state = (formData.get("state") as string)?.trim();
      if (formData.has("postalCode")) data.postalCode = (formData.get("postalCode") as string)?.trim();
      if (formData.has("country")) data.country = (formData.get("country") as string)?.trim();
      break;
    case "FILE":
      if (formData.has("fileId")) data.fileId = (formData.get("fileId") as string)?.trim();
      if (formData.has("fileName")) data.fileName = (formData.get("fileName") as string)?.trim();
      if (formData.has("sizeBytes") && formData.get("sizeBytes")) data.sizeBytes = Number(formData.get("sizeBytes"));
      if (formData.has("mimeType")) data.mimeType = (formData.get("mimeType") as string)?.trim();
      break;
  }
  return data;
}

export async function createQrAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const type = (formData.get("type") as string) ?? "URL";
  const data = extractQrData(formData, type);

  let design: Record<string, unknown> | undefined;
  const designRaw = formData.get("design");
  if (typeof designRaw === "string" && designRaw.trim().startsWith("{")) {
    try {
      design = JSON.parse(designRaw);
    } catch {
      // ignore
    }
  }

  const rawData = {
    name: formData.get("name"),
    type,
    data,
    ...(design ? { design } : {}),
  };

  const parsed = createQrSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  const result = await createQr(userId, {
    name: parsed.data.name,
    type: parsed.data.type,
    data: parsed.data.data,
    design: design as any,
  });
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    data: { qr: result.qr },
    message: `QR code "${result.qr.name}" created!`,
  };
}

export async function updateQrAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "QR ID is required" };
  }

  const type = formData.get("type") as string | undefined;
  const data = type ? extractQrData(formData, type) : undefined;

  const rawData = {
    name: (formData.get("name") as string | undefined) || undefined,
    type: type || undefined,
    ...(data && Object.keys(data).length > 0 ? { data } : {}),
  };

  const parsed = updateQrSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  const result = await updateQr(id, userId, parsed.data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    data: { qr: result.qr },
    message: "QR code updated!",
  };
}

export async function deleteQrAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "QR ID is required" };
  }

  const result = await deleteQr(id, userId);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, message: "QR code deleted." };
}

export async function duplicateQrAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "QR ID is required" };
  }

  const result = await duplicateQr(id, userId);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    data: { qr: result.qr },
    message: `Duplicated as "${result.qr.name}"`,
  };
}

export async function toggleQrStatusAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const action = formData.get("action") as "enable" | "disable";
  if (!id || !action) {
    return { success: false, error: "Invalid request" };
  }

  const result = action === "enable" ? await enableQr(id, userId) : await disableQr(id, userId);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return {
    success: true,
    data: { qr: result.qr },
    message: action === "enable" ? "QR code enabled." : "QR code disabled.",
  };
}