"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

export type CostCategory =
  | "Domain & Hosting"
  | "Software & Tools"
  | "Marketing"
  | "Office Expense"
  | "Travel & Transport"
  | "Utilities"
  | "Salary & Contractor"
  | "Other";
export type CostPaymentMethod =
  | "Company Card"
  | "Bank Transfer"
  | "Cheque"
  | "Mobile Banking"
  | "Cash"
  | "Other";
export type CostPayer = "Sahak" | "Ruyel";

export interface CostAttachment {
  url: string;
  name: string;
  type: "image" | "video";
  size: number;
}

export interface Cost {
  _id: string;
  title: string;
  category: CostCategory;
  customCategory?: string;
  reason: string;
  amount: number;
  date: string;
  paymentMethod: CostPaymentMethod;
  paidBy: CostPayer;
  reference?: string;
  comment?: string;
  attachment?: CostAttachment;
  createdAt: string;
  updatedAt: string;
}

export interface CostSummary {
  total: number;
  totalAmount: number;
  monthAmount: number;
  todayAmount: number;
  todayCount: number;
  attachmentCount: number;
}

export interface CostListResult {
  costs: Cost[];
  summary: CostSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CostActionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: string[];
}

interface ApiCost extends Omit<Cost, "date"> {
  expenseDate: string;
}

async function getAuthToken() {
  const session = await auth();
  return (session?.user as { accessToken?: string } | undefined)?.accessToken;
}

async function parseError(
  response: Response,
  fallback: string,
): Promise<{ message: string; errors?: string[] }> {
  try {
    const body = await response.json();
    return {
      message: typeof body?.message === "string" ? body.message : fallback,
      errors: Array.isArray(body?.errors) ? body.errors : undefined,
    };
  } catch {
    return { message: fallback };
  }
}

const normalizeCost = (cost: ApiCost): Cost => {
  const { expenseDate, ...rest } = cost;
  return { ...rest, date: expenseDate };
};

export async function listCostsAction(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: CostCategory;
    paidBy?: CostPayer;
  } = {},
): Promise<CostActionResponse<CostListResult>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.paidBy) query.set("paidBy", params.paidBy);

  try {
    const response = await fetch(`${API}/costs?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to fetch costs.");
      return { ok: false, error: message };
    }

    const body = await response.json();
    return {
      ok: true,
      data: {
        ...body.data,
        costs: (body.data.costs as ApiCost[]).map(normalizeCost),
      },
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

async function submitCost(
  endpoint: string,
  method: "POST" | "PATCH",
  formData: FormData,
  fallback: string,
): Promise<CostActionResponse<Cost>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const { message, errors } = await parseError(response, fallback);
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await response.json();
    revalidatePath("/settings/costing");
    return { ok: true, data: normalizeCost(body.data as ApiCost) };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function createCostAction(
  formData: FormData,
): Promise<CostActionResponse<Cost>> {
  return submitCost("/costs", "POST", formData, "Failed to add cost.");
}

export async function updateCostAction(
  id: string,
  formData: FormData,
): Promise<CostActionResponse<Cost>> {
  return submitCost(`/costs/${id}`, "PATCH", formData, "Failed to update cost.");
}

export async function deleteCostAction(
  id: string,
): Promise<CostActionResponse<null>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/costs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to delete cost.");
      return { ok: false, error: message };
    }
    revalidatePath("/settings/costing");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
