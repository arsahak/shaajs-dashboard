"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type VendorStatus = "active" | "pending" | "inactive" | "disabled";
export type VendorLevel = "verified" | "trusted" | "top_rated";
export type VendorOwnership = "own" | "third_party";

export interface VendorDocument {
  url: string;
  key: string;
  name: string;
  size: number;
}

export interface VendorCategoryCommission {
  category: string;
  rate: number;
}

export interface Vendor {
  _id: string;
  name: string;
  slug: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  socialLink?: string;
  description?: string;
  status: VendorStatus;
  level: VendorLevel;
  ownership: VendorOwnership;
  categories: string[];
  commissionRate?: number;
  categoryCommissions: VendorCategoryCommission[];
  commissionNotes?: string;
  logo?: VendorDocument;
  coverImage?: VendorDocument;
  agreementDocument?: VendorDocument;
  businessDocuments: VendorDocument[];
  createdAt: string;
  updatedAt: string;
}

interface VendorDataResponse<T = unknown> {
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

// ── List vendors (manager/admin/superadmin only) ─────────────────────────────

export async function listVendorsAction(): Promise<
  VendorDataResponse<Vendor[]>
> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/vendors`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch vendors.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Get a single vendor ───────────────────────────────────────────────────────

export async function getVendorAction(
  id: string,
): Promise<VendorDataResponse<Vendor>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/vendors/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch vendor.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Create vendor (manager/admin/superadmin only) ────────────────────────────
// Expects a FormData built from the add-vendor form: name, contactPerson,
// email, phone, address, website, socialLink, password, description, status,
// level, ownership, categories (JSON array), commissionRate,
// categoryCommissions (JSON array), commissionNotes, and optional logo /
// coverImage / agreementDocument / businessDocuments files. Forwarded as-is
// so fetch sets the correct multipart boundary itself.

export async function createVendorAction(
  formData: FormData,
): Promise<VendorDataResponse<Vendor>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/vendors`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to create vendor.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Update vendor (manager/admin/superadmin only) ────────────────────────────

export async function updateVendorAction(
  id: string,
  formData: FormData,
): Promise<VendorDataResponse<Vendor>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/vendors/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to update vendor.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Delete vendor (manager/admin/superadmin only) ────────────────────────────

export async function deleteVendorAction(
  id: string,
): Promise<VendorDataResponse<null>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/vendors/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to delete vendor.");
      return { ok: false, error: message };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
