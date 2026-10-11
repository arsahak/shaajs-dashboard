"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StockProductRef {
  _id: string;
  title: string;
  sku: string;
  stock: number;
  featureImage?: string;
}

export interface StockSupplierRef {
  _id: string;
  name: string;
}

export interface Stock {
  _id: string;
  // Populated ({_id, title, sku, stock, featureImage} / {_id, name}) on GET
  // endpoints; a bare id string on the create/update response.
  product: string | StockProductRef;
  supplier: string | StockSupplierRef;
  quantity: number;
  costPrice?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockListResult {
  stocks: Stock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListStocksParams {
  page?: number;
  limit?: number;
  product?: string;
  supplier?: string;
}

export interface StockInput {
  product: string;
  supplier: string;
  quantity: number;
  costPrice?: number;
  note?: string;
}

interface StockDataResponse<T = unknown> {
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

// ── List stock entries (manager/admin/superadmin only) ──────────────────────

export async function listStocksAction(
  params: ListStocksParams = {},
): Promise<StockDataResponse<StockListResult>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.product) query.set("product", params.product);
  if (params.supplier) query.set("supplier", params.supplier);

  try {
    const res = await fetch(`${API}/stocks?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch stock entries.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Get a single stock entry ─────────────────────────────────────────────────

export async function getStockAction(
  id: string,
): Promise<StockDataResponse<Stock>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/stocks/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch stock entry.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Add stock received from a supplier for a product ────────────────────────
// Increases the referenced product's stock count by `quantity` on the backend.

export async function createStockAction(
  input: StockInput,
): Promise<StockDataResponse<Stock>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/stocks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to add stock.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Update a stock entry (manager/admin/superadmin only) ────────────────────
// Adjusts the affected product(s)' stock counts to reflect the change.

export async function updateStockAction(
  id: string,
  input: Partial<StockInput>,
): Promise<StockDataResponse<Stock>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/stocks/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to update stock entry.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Delete a stock entry (manager/admin/superadmin only) ────────────────────
// Reverses its effect by subtracting `quantity` back off the product's stock.

export async function deleteStockAction(
  id: string,
): Promise<StockDataResponse<null>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/stocks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to delete stock entry.");
      return { ok: false, error: message };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
