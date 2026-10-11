"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductUnit = "kg" | "g" | "l" | "ml" | "pcs";

export interface ProductCategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductBrandRef {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductVendorRef {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductColor {
  name: string;
  /** Swatch color as #rrggbb. */
  hex: string;
  sizes: string[];
  /** Photos of the product in this color. */
  images?: string[];
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  sku: string;
  // Populated ({_id, name, slug}) on GET /products and GET /products/:id;
  // a bare id string on the create/update response (those don't populate).
  category: string | ProductCategoryRef;
  brand?: string | ProductBrandRef | null;
  // null/unset means this is the shop's own product.
  vendor?: string | ProductVendorRef | null;
  shortDescription?: string;
  overview?: string;
  featureImage?: string;
  galleryImages: string[];
  // "upload" is hosted on DigitalOcean Spaces; "youtube" is a canonical
  // https://www.youtube.com/embed/{id} URL. Empty string means no video.
  videoUrl?: string;
  videoSource?: "" | "upload" | "youtube";
  // Optional variations: `sizes` is the product's free-text size list, and
  // each color names the subset of those sizes it comes in. Both are empty
  // (or absent on older responses) for products without variations.
  sizes?: string[];
  colors?: ProductColor[];
  // Sizes priced differently: `adjustment` is added to both price and
  // discountPrice (negative = cheaper). Sizes not listed cost the base price.
  sizePrices?: { size: string; adjustment: number }[];
  price: number;
  discountPrice?: number;
  unit: ProductUnit;
  weight: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  // Auto-expires 30 days after being turned on — newArrivalSetAt is when
  // that happened; null once expired or never set.
  isNewArrival: boolean;
  newArrivalSetAt?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
}

interface ProductDataResponse<T = unknown> {
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

// ── List products (public backend endpoint — no auth required) ────────────────

export async function listProductsAction(
  params: ListProductsParams = {},
): Promise<ProductDataResponse<ProductListResult>> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.category) query.set("category", params.category);
    if (params.search) query.set("search", params.search);
    if (params.isActive !== undefined) {
      query.set("isActive", String(params.isActive));
    }
    if (params.isFeatured !== undefined) {
      query.set("isFeatured", String(params.isFeatured));
    }
    if (params.isTrending !== undefined) {
      query.set("isTrending", String(params.isTrending));
    }
    if (params.isNewArrival !== undefined) {
      query.set("isNewArrival", String(params.isNewArrival));
    }

    const qs = query.toString();
    const res = await fetch(`${API}/products${qs ? `?${qs}` : ""}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch products.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Get a single product (public) ──────────────────────────────────────────────
// Accepts either the product's ObjectId or its slug — the backend looks up
// whichever was passed.

export async function getProductAction(
  idOrSlug: string,
): Promise<ProductDataResponse<Product>> {
  try {
    const res = await fetch(`${API}/products/${idOrSlug}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to fetch product.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Suggest the next auto-generated SKU (manager/admin/superadmin only) ────────
// Purely a suggestion to prefill the Add Product form — the SKU field stays
// editable so staff can override it.

export async function getNextSkuAction(): Promise<
  ProductDataResponse<{ sku: string }>
> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/products/next-sku`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to generate SKU.");
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Create product (manager/admin/superadmin only) ─────────────────────────────
// Expects a FormData built from the add-product form: title, sku, category,
// shortDescription, overview, price, discountPrice, unit, weight, stock,
// isActive, isFeatured, sortOrder, an optional `featureImage` file, and zero
// or more `galleryImages` file entries. Forwarded as-is so fetch sets the
// correct multipart boundary itself.

export async function createProductAction(
  formData: FormData,
): Promise<ProductDataResponse<Product>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to create product.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Update product (manager/admin/superadmin only) ──────────────────────────────
// A new featureImage/galleryImages file replaces the existing one(s) and
// deletes the old file(s) from storage — see the backend route docs.

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<ProductDataResponse<Product>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/products/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const { message, errors } = await parseError(
        res,
        "Failed to update product.",
      );
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// ── Delete product (manager/admin/superadmin only) ──────────────────────────────

export async function deleteProductAction(
  id: string,
): Promise<ProductDataResponse<null>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const res = await fetch(`${API}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const { message } = await parseError(res, "Failed to delete product.");
      return { ok: false, error: message };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
