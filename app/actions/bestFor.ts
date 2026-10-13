"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Who or what a product is best for. The list has two levels: an entry with
 * no `parent` is a group ("Skin Type"); one with a `parent` is an option in
 * that group ("Dry"), and options are what products are tagged with.
 */
export interface BestFor {
  _id: string;
  name: string;
  slug: string;
  /** The group's id; null or absent when the entry is itself a group. */
  parent?: string | null;
  /** The icon the card shows when it has no picture — an icon name. */
  icon?: string;
  /**
   * The picture on the entry's card, shown in place of the icon; "" or
   * absent when it has none.
   */
  image?: string;
  /** The card's background gradient: two #rrggbb colors, start then end. */
  colors?: string[];
  isActive: boolean;
  sortOrder: number;
  /** Active products tagged with this option (from the list endpoint). */
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface BestForDataResponse<T = unknown> {
  ok: boolean;
  data?: T | null;
  error?: string;
  fieldErrors?: string[];
}

async function getAuthToken() {
  const session = await auth();
  return (session?.user as any)?.accessToken as string | undefined;
}

async function parseError(
  res: Response,
  fallback: string,
): Promise<{ message: string; errors?: string[] }> {
  try {
    const body = await res.json();
    return {
      message: typeof body?.message === "string" ? body.message : fallback,
      errors: Array.isArray(body?.errors) ? body.errors : undefined,
    };
  } catch {
    return { message: fallback };
  }
}

// ── List groups and options (public backend endpoint — no auth required) ─────

export async function listBestForAction(): Promise<
  BestForDataResponse<BestFor[]>
> {
  try {
    const res = await fetch(`${API}/best-for`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(
        res,
        "Failed to fetch the Best For list.",
      );
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Get a single entry (public) ──────────────────────────────────────────────

export async function getBestForAction(
  id: string,
): Promise<BestForDataResponse<BestFor>> {
  try {
    const res = await fetch(`${API}/best-for/${id}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch the entry.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Create a group or an option (manager/admin/superadmin only) ──────────────
// Expects a FormData built from the Best For form: name, parent ("" for a
// group), icon (an icon name), isActive, sortOrder, colors (a JSON pair of
// #rrggbb) and an optional PNG `image` file. Forwarded as-is so fetch sets the correct multipart
// boundary itself.

export async function createBestForAction(
  formData: FormData,
): Promise<BestForDataResponse<BestFor>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/best-for`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(res, "Failed to create.");
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Update a group or an option (manager/admin/superadmin only) ──────────────
// Same FormData as create; `removeImage` = "true" takes the picture off.

export async function updateBestForAction(
  id: string,
  formData: FormData,
): Promise<BestForDataResponse<BestFor>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/best-for/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(res, "Failed to update.");
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Delete a group (with its options) or an option ───────────────────────────

export async function deleteBestForAction(
  id: string,
): Promise<BestForDataResponse<null>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/best-for/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to delete.");
      return { ok: false, error: message };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
