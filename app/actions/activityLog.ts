"use server";

import { auth } from "@/auth";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActivityAction = "create" | "update" | "delete";

export type ActivityModuleName =
  | "product"
  | "category"
  | "brand"
  | "supplier"
  | "stock"
  | "order"
  | "customer"
  | "staff"
  | "review"
  | "costing";

export interface ActivityLogUserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  role: string;
}

export interface ActivityLog {
  _id: string;
  user: ActivityLogUserRef | string;
  userName: string;
  userRole: string;
  action: ActivityAction;
  module: ActivityModuleName;
  resourceId?: string;
  resourceName?: string;
  description: string;
  createdAt: string;
}

export interface ActivityLogListResult {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListActivityLogsParams {
  page?: number;
  limit?: number;
  module?: ActivityModuleName;
  action?: ActivityAction;
  user?: string;
  search?: string;
}

interface ActivityLogDataResponse<T = unknown> {
  ok: boolean;
  data?: T | null;
  error?: string;
}

async function getAuthToken() {
  const session = await auth();
  return (session?.user as any)?.accessToken as string | undefined;
}

async function parseError(
  res: Response,
  fallback: string,
): Promise<{ message: string }> {
  try {
    const body = await res.json();
    return {
      message: typeof body?.message === "string" ? body.message : fallback,
    };
  } catch {
    return { message: fallback };
  }
}

// ── List activity logs (admin/superadmin only) ───────────────────────────────

export async function listActivityLogsAction(
  params: ListActivityLogsParams = {},
): Promise<ActivityLogDataResponse<ActivityLogListResult>> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Not authenticated." };

  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.module) query.set("module", params.module);
  if (params.action) query.set("action", params.action);
  if (params.user) query.set("user", params.user);
  if (params.search) query.set("search", params.search);

  try {
    const res = await fetch(`${API}/activity-logs?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const { message } = await parseError(
        res,
        "Failed to fetch activity logs.",
      );
      return { ok: false, error: message };
    }
    const body = await res.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
