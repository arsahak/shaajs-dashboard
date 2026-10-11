"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

interface UploadDataResponse<T = unknown> {
  ok: boolean;
  data?: T | null;
  error?: string;
}

async function getAuthToken() {
  const session = await auth();
  return (session?.user as any)?.accessToken as string | undefined;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === "string" ? body.message : fallback;
  } catch {
    return fallback;
  }
}

// ── Upload an inline image for rich-text content (manager/admin/superadmin) ────
// Used by RichTextEditor's image-upload handler — separate from a resource's
// own feature/gallery image uploads, which post directly to that resource.

export async function uploadEditorImageAction(
  formData: FormData,
): Promise<UploadDataResponse<{ url: string }>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/uploads/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const message = await parseError(res, "Failed to upload image.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
