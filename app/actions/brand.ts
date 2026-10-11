"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BrandDataResponse<T = unknown> {
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

// ── List brands (public backend endpoint — no auth required) ──────────────────

export async function listBrandsAction(): Promise<BrandDataResponse<Brand[]>> {
  try {
    const res = await fetch(`${API}/brands`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch brands.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Get a single brand (public) ─────────────────────────────────────────────

export async function getBrandAction(
  id: string,
): Promise<BrandDataResponse<Brand>> {
  try {
    const res = await fetch(`${API}/brands/${id}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch brand.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Create brand (manager/admin/superadmin only) ────────────────────────────
// Expects a FormData built from the add-brand form: name, description,
// isActive, sortOrder, and an optional `logo` file. Forwarded as-is so fetch
// sets the correct multipart boundary itself.

export async function createBrandAction(
  formData: FormData,
): Promise<BrandDataResponse<Brand>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/brands`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to create brand.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Update brand (manager/admin/superadmin only) ────────────────────────────

export async function updateBrandAction(
  id: string,
  formData: FormData,
): Promise<BrandDataResponse<Brand>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/brands/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to update brand.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Delete brand (manager/admin/superadmin only) ─────────────────────────────

export async function deleteBrandAction(
  id: string,
): Promise<BrandDataResponse<null>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/brands/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to delete brand.");
      return { ok: false, error: message };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
