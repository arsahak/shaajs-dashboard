"use client";

import {
  Vendor,
  VendorStatus,
  deleteVendorAction,
  listVendorsAction,
} from "@/app/actions/vendors";
import Pagination from "@/components/shared/Pagination";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiCheckCircle,
  BiEnvelope,
  BiPencil,
  BiShow,
  BiStore,
  BiTrash,
  BiXCircle,
} from "react-icons/bi";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<VendorStatus, string> = {
  active: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  inactive: "bg-gray-100 text-gray-600",
  disabled: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<VendorStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  disabled: "Disabled",
};

const VendorsList = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const res = await listVendorsAction();
    if (res.ok && res.data) {
      setVendors(res.data);
    } else {
      toast.error(res.error || "Failed to load vendors");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const totalPages = Math.max(1, Math.ceil(vendors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedVendors = useMemo(
    () =>
      vendors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [vendors, currentPage],
  );

  // Statistics
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === "active").length;
  const inactiveVendors = vendors.filter(
    (v) => v.status === "inactive" || v.status === "disabled",
  ).length;
  const vendorsWithContact = vendors.filter((v) => !!v.email).length;

  const stats = [
    {
      title: "Total Vendors",
      value: totalVendors,
      subtitle: "All registered vendors",
      icon: <BiStore size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Active",
      value: activeVendors,
      subtitle: "Currently sourcing from",
      icon: <BiCheckCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Inactive",
      value: inactiveVendors,
      subtitle: "Inactive or disabled",
      icon: <BiXCircle size={20} />,
      color: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "With Contact Info",
      value: vendorsWithContact,
      subtitle: "Have an email on file",
      icon: <BiEnvelope size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`))
      return;

    const res = await deleteVendorAction(vendor._id);
    if (res.ok) {
      setVendors((prev) => prev.filter((v) => v._id !== vendor._id));
      toast.success("Vendor deleted");
    } else {
      toast.error(res.error || "Failed to delete vendor");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage the vendors you source products from
            </p>
          </div>
          <Link
            href="/vendors/add"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiStore size={18} />
            Add Vendor
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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
              {loading ? (
                <span className="block h-8 w-16 bg-gray-100 animate-pulse rounded"></span>
              ) : (
                stat.value
              )}
            </p>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Vendors Table */}
      <div className="rounded border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 shrink-0 bg-gray-100 animate-pulse rounded-lg"></div>
                          <div className="h-4 w-32 bg-gray-100 animate-pulse rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                : paginatedVendors.map((vendor) => (
                    <tr
                      key={vendor._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/vendors/${vendor._id}`}
                          className="flex items-center gap-2.5 group"
                        >
                          {vendor.logo?.url ? (
                            <Image
                              src={vendor.logo.url}
                              alt={vendor.name}
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <BiStore size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px] group-hover:underline">
                              {vendor.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">
                              {vendor.contactPerson || "—"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {vendor.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {vendor.phone || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[vendor.status]}`}
                        >
                          {STATUS_LABEL[vendor.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/vendors/${vendor._id}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            title="View vendor"
                          >
                            <BiShow size={18} />
                          </Link>
                          <Link
                            href={`/vendors/edit?id=${vendor._id}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            title="Edit vendor"
                          >
                            <BiPencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(vendor)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete vendor"
                          >
                            <BiTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && vendors.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiStore size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No vendors yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Add your first vendor to start tracking who you source products
              from.
            </p>
          </div>
        )}

        {!loading && vendors.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsList;
