"use client";

import {
  Supplier,
  deleteSupplierAction,
  listSuppliersAction,
} from "@/app/actions/supplier";
import Pagination from "@/components/shared/Pagination";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiCheckCircle,
  BiEnvelope,
  BiPencil,
  BiPhone,
  BiPlus,
  BiStore,
  BiTrash,
  BiXCircle,
} from "react-icons/bi";

const PAGE_SIZE = 10;

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const res = await listSuppliersAction();
    if (res.ok && res.data) {
      setSuppliers(res.data);
    } else {
      toast.error(res.error || "Failed to load suppliers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const totalPages = Math.max(1, Math.ceil(suppliers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedSuppliers = useMemo(
    () =>
      suppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [suppliers, currentPage],
  );

  // Statistics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const inactiveSuppliers = suppliers.filter((s) => !s.isActive).length;
  const withContact = suppliers.filter((s) => s.email || s.phone).length;

  const stats = [
    {
      title: "Total Suppliers",
      value: totalSuppliers,
      subtitle: "All registered suppliers",
      icon: <BiStore size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Active",
      value: activeSuppliers,
      subtitle: "Available to receive stock from",
      icon: <BiCheckCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Inactive",
      value: inactiveSuppliers,
      subtitle: "Not currently in use",
      icon: <BiXCircle size={20} />,
      color: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "With Contact Info",
      value: withContact,
      subtitle: "Have an email or phone on file",
      icon: <BiPhone size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const handleDelete = async (supplier: Supplier) => {
    if (
      !confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)
    )
      return;

    const res = await deleteSupplierAction(supplier._id);
    if (res.ok) {
      setSuppliers((prev) => prev.filter((s) => s._id !== supplier._id));
      toast.success("Supplier deleted");
    } else {
      toast.error(res.error || "Failed to delete supplier");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage the vendors you receive product stock from
            </p>
          </div>
          <Link
            href="/inventory/supplier/add"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiPlus size={18} />
            Add Supplier
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

      {/* Suppliers Table */}
      <div className="rounded border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact
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
                        <div className="h-4 w-40 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-12 bg-gray-100 animate-pulse rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                : paginatedSuppliers.map((supplier) => (
                    <tr
                      key={supplier._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {supplier.logo ? (
                            <Image
                              src={supplier.logo}
                              alt={supplier.name}
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
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                              {supplier.name}
                            </p>
                            {supplier.contactPerson && (
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                {supplier.contactPerson}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-sm text-gray-700">
                          {supplier.email && (
                            <div className="flex items-center gap-1.5">
                              <BiEnvelope size={14} className="text-gray-400" />
                              <span className="truncate max-w-[200px]">
                                {supplier.email}
                              </span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1.5">
                              <BiPhone size={14} className="text-gray-400" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {!supplier.email && !supplier.phone && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            supplier.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/inventory/supplier/edit?id=${supplier._id}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            title="Edit supplier"
                          >
                            <BiPencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete supplier"
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
        {!loading && suppliers.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiStore size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No suppliers yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Add your first supplier to start recording stock you receive
              from them.
            </p>
          </div>
        )}

        {!loading && suppliers.length > 0 && totalPages > 1 && (
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

export default SupplierList;
