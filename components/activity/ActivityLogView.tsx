"use client";

import {
  ActivityAction,
  ActivityLog,
  ActivityLogUserRef,
  ActivityModuleName,
  listActivityLogsAction,
} from "@/app/actions/activityLog";
import Pagination from "@/components/shared/Pagination";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiHistory,
  BiMinusCircle,
  BiPencil,
  BiPlusCircle,
  BiSearch,
  BiUser,
} from "react-icons/bi";

const PAGE_SIZE = 20;

const MODULE_OPTIONS: { value: ActivityModuleName | ""; label: string }[] = [
  { value: "", label: "All Modules" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "supplier", label: "Supplier" },
  { value: "stock", label: "Stock" },
  { value: "order", label: "Order" },
  { value: "customer", label: "Customer" },
  { value: "staff", label: "Staff" },
  { value: "review", label: "Review" },
  { value: "costing", label: "Costing" },
];

const ACTION_OPTIONS: { value: ActivityAction | ""; label: string }[] = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
];

const inputClass =
  "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

function actionBadgeClass(action: ActivityAction) {
  if (action === "create") return "bg-green-50 text-green-700";
  if (action === "update") return "bg-blue-50 text-blue-700";
  return "bg-red-50 text-red-700";
}

function roleBadgeClass(role: string) {
  if (role === "superadmin") return "bg-purple-50 text-purple-700";
  if (role === "admin") return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ActivityLogView = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [moduleFilter, setModuleFilter] = useState<ActivityModuleName | "">(
    "",
  );
  const [actionFilter, setActionFilter] = useState<ActivityAction | "">("");
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    creates: 0,
    updates: 0,
    deletes: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await listActivityLogsAction({
      page,
      limit: PAGE_SIZE,
      module: moduleFilter || undefined,
      action: actionFilter || undefined,
      search: search || undefined,
    });
    if (res.ok && res.data) {
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } else {
      toast.error(res.error || "Failed to load activity logs");
    }
    setLoading(false);
  }, [page, moduleFilter, actionFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    (async () => {
      setStatsLoading(true);
      const [all, creates, updates, deletes] = await Promise.all([
        listActivityLogsAction({ limit: 1 }),
        listActivityLogsAction({ limit: 1, action: "create" }),
        listActivityLogsAction({ limit: 1, action: "update" }),
        listActivityLogsAction({ limit: 1, action: "delete" }),
      ]);
      setStats({
        total: all.ok && all.data ? all.data.total : 0,
        creates: creates.ok && creates.data ? creates.data.total : 0,
        updates: updates.ok && updates.data ? updates.data.total : 0,
        deletes: deletes.ok && deletes.data ? deletes.data.total : 0,
      });
      setStatsLoading(false);
    })();
  }, []);

  const statCards = [
    {
      title: "Total Activity",
      value: stats.total,
      subtitle: "All recorded actions",
      icon: <BiHistory size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Created",
      value: stats.creates,
      subtitle: "New records added",
      icon: <BiPlusCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Updated",
      value: stats.updates,
      subtitle: "Existing records changed",
      icon: <BiPencil size={20} />,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Deleted",
      value: stats.deletes,
      subtitle: "Records removed",
      icon: <BiMinusCircle size={20} />,
      color: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track which staff member created, updated, or deleted what, and when
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="rounded border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <span className={stat.iconColor}>{stat.icon}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700">
                {stat.title}
              </h3>
            </div>
            <p className="mb-1 text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <span className="block h-8 w-16 bg-gray-100 animate-pulse rounded"></span>
              ) : (
                stat.value
              )}
            </p>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <BiSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by user, resource, or description"
              className={`${inputClass} w-full pl-9`}
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => {
              setPage(1);
              setModuleFilter(e.target.value as ActivityModuleName | "");
            }}
            className={inputClass}
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => {
              setPage(1);
              setActionFilter(e.target.value as ActivityAction | "");
            }}
            className={inputClass}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 shrink-0 bg-gray-100 animate-pulse rounded-full"></div>
                          <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-48 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                    </tr>
                  ))
                : logs.map((log) => {
                    const user =
                      typeof log.user === "string"
                        ? null
                        : (log.user as ActivityLogUserRef);
                    const userLabel = user
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : log.userName;

                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <BiUser size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                                {userLabel}
                              </p>
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeClass(
                                  log.userRole,
                                )}`}
                              >
                                {log.userRole}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${actionBadgeClass(
                              log.action,
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 capitalize">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">
                            {log.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiHistory size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No activity recorded yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Actions taken by staff — creating, editing, or deleting records —
              will show up here.
            </p>
          </div>
        )}

        {!loading && logs.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogView;
