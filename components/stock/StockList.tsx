"use client";

import {
  Stock,
  StockProductRef,
  StockSupplierRef,
  deleteStockAction,
  listStocksAction,
} from "@/app/actions/stock";
import Pagination from "@/components/shared/Pagination";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiBox,
  BiPackage,
  BiPencil,
  BiPlus,
  BiStore,
  BiTrash,
} from "react-icons/bi";

const PAGE_SIZE = 10;

const currency = (value: number) =>
  `৳${value.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

const StockList = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    const res = await listStocksAction({ limit: 100 });
    if (res.ok && res.data) {
      setStocks(res.data.stocks);
    } else {
      toast.error(res.error || "Failed to load stock entries");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const totalPages = Math.max(1, Math.ceil(stocks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedStocks = useMemo(
    () => stocks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [stocks, currentPage],
  );

  // Statistics
  const totalEntries = stocks.length;
  const totalUnitsReceived = stocks.reduce((sum, s) => sum + s.quantity, 0);
  const totalCost = stocks.reduce(
    (sum, s) => sum + (s.costPrice || 0) * s.quantity,
    0,
  );
  const uniqueSuppliers = new Set(
    stocks.map((s) =>
      typeof s.supplier === "string" ? s.supplier : s.supplier._id,
    ),
  ).size;

  const stats = [
    {
      title: "Stock Entries",
      value: totalEntries,
      subtitle: "Deliveries recorded",
      icon: <BiBox size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Units Received",
      value: totalUnitsReceived,
      subtitle: "Total quantity added to stock",
      icon: <BiPackage size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Total Cost",
      value: currency(totalCost),
      subtitle: "Spent across all deliveries",
      icon: <BiBox size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Suppliers Used",
      value: uniqueSuppliers,
      subtitle: "Distinct suppliers stocked from",
      icon: <BiStore size={20} />,
      color: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  const handleDelete = async (stock: Stock) => {
    const productName =
      typeof stock.product === "string" ? "this product" : stock.product.title;
    if (
      !confirm(
        `Delete this stock entry for "${productName}"? This will subtract ${stock.quantity} unit(s) back off the product's stock.`,
      )
    )
      return;

    const res = await deleteStockAction(stock._id);
    if (res.ok) {
      setStocks((prev) => prev.filter((s) => s._id !== stock._id));
      toast.success("Stock entry deleted");
    } else {
      toast.error(res.error || "Failed to delete stock entry");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track stock received from suppliers, product by product
            </p>
          </div>
          <Link
            href="/inventory/stock/add"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiPlus size={18} />
            Add Stock
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

      {/* Stock Table */}
      <div className="rounded border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
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
                        <div className="h-4 w-28 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-10 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-20 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-12 bg-gray-100 animate-pulse rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                : paginatedStocks.map((stock) => {
                    const product =
                      typeof stock.product === "string"
                        ? null
                        : (stock.product as StockProductRef);
                    const supplier =
                      typeof stock.supplier === "string"
                        ? null
                        : (stock.supplier as StockSupplierRef);

                    return (
                      <tr
                        key={stock._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {product?.featureImage ? (
                              <Image
                                src={product.featureImage}
                                alt={product.title}
                                width={36}
                                height={36}
                                className="h-9 w-9 shrink-0 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <BiPackage size={18} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                                {product?.title || "—"}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                {product?.sku}
                                {product && (
                                  <> · Stock: {product.stock}</>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {supplier?.name || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            +{stock.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {stock.costPrice !== undefined
                              ? currency(stock.costPrice)
                              : "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {new Date(stock.createdAt).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short", year: "numeric" },
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/inventory/stock/edit?id=${stock._id}`}
                              className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                              title="Edit stock entry"
                            >
                              <BiPencil size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(stock)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Delete stock entry"
                            >
                              <BiTrash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && stocks.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiBox size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No stock entries yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Record your first delivery from a supplier to start tracking
              stock.
            </p>
          </div>
        )}

        {!loading && stocks.length > 0 && totalPages > 1 && (
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

export default StockList;
