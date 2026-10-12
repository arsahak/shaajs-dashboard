"use client";

import {
  Brand,
  deleteBrandAction,
  listBrandsAction,
  updateBrandAction,
} from "@/app/actions/brand";
import Pagination from "@/components/shared/Pagination";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiCheckCircle,
  BiImage,
  BiPencil,
  BiPlus,
  BiPurchaseTagAlt,
  BiSearch,
  BiSolidStar,
  BiStar,
  BiTrash,
  BiXCircle,
} from "react-icons/bi";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const BrandList = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const tableRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [topOnly, setTopOnly] = useState(false);
  // The brand whose "top brand" star is being saved right now.
  const [savingTopId, setSavingTopId] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    const res = await listBrandsAction();
    if (res.ok && res.data) {
      setBrands(res.data);
    } else {
      toast.error(res.error || "Failed to load brands");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // What the table shows: the search and the "top brands only" switch
  // narrow the full list, which is then paged.
  const visibleBrands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return brands.filter(
      (b) =>
        (!topOnly || b.isTopBrand) &&
        (!term || b.name.toLowerCase().includes(term)),
    );
  }, [brands, search, topOnly]);

  const totalPages = Math.max(1, Math.ceil(visibleBrands.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedBrands = useMemo(
    () =>
      visibleBrands.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visibleBrands, currentPage, pageSize],
  );

  // Changing page from the bottom of a long table brings its top back into
  // view, so the new rows are read from the first one.
  const goToPage = (next: number) => {
    setPage(next);
    const table = tableRef.current;
    if (table && table.getBoundingClientRect().top < 0) {
      table.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Statistics
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => b.isActive).length;
  const inactiveBrands = brands.filter((b) => !b.isActive).length;
  const brandsWithLogo = brands.filter((b) => !!b.logo).length;
  const topBrands = brands.filter((b) => b.isTopBrand).length;

  const stats = [
    {
      title: "Total Brands",
      value: totalBrands,
      subtitle: "All product brands",
      icon: <BiPurchaseTagAlt size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Active",
      value: activeBrands,
      subtitle: "Visible in the storefront",
      icon: <BiCheckCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Inactive",
      value: inactiveBrands,
      subtitle: "Hidden from customers",
      icon: <BiXCircle size={20} />,
      color: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "With Logo",
      value: brandsWithLogo,
      subtitle: "Have a logo uploaded",
      icon: <BiImage size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  // The star in each row: marks or unmarks the brand as a top brand.
  const handleToggleTop = async (brand: Brand) => {
    if (savingTopId) return;
    const next = !brand.isTopBrand;
    const formData = new FormData();
    formData.set("isTopBrand", String(next));

    setSavingTopId(brand._id);
    const res = await updateBrandAction(brand._id, formData);
    setSavingTopId(null);

    if (res.ok) {
      setBrands((prev) =>
        prev.map((b) =>
          b._id === brand._id ? { ...b, isTopBrand: next } : b,
        ),
      );
      toast.success(
        next
          ? `"${brand.name}" is now a top brand`
          : `"${brand.name}" removed from top brands`,
      );
    } else {
      toast.error(res.error || "Failed to update brand");
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`Delete brand "${brand.name}"? This cannot be undone.`))
      return;

    const res = await deleteBrandAction(brand._id);
    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b._id !== brand._id));
      toast.success("Brand deleted");
    } else {
      toast.error(res.error || "Failed to delete brand");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage the brands your products are sold under
            </p>
          </div>
          <Link
            href="/products/brand/add"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiPlus size={18} />
            Add Brand
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

      {/* Brands Table */}
      <div
        ref={tableRef}
        className="scroll-mt-4 rounded border border-gray-200 bg-white overflow-hidden"
      >
        {/* Find a brand, or see only the top brands picked so far. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div className="relative w-full max-w-xs">
            <BiSearch
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search brands…"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setTopOnly((v) => !v);
              setPage(1);
            }}
            aria-pressed={topOnly}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              topOnly
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BiSolidStar size={16} className="text-amber-500" />
            Top brands ({topBrands})
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Top Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sort Order
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
                        <div className="h-6 w-6 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-8 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-10 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-12 bg-gray-100 animate-pulse rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                : paginatedBrands.map((brand) => (
                    <tr
                      key={brand._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {brand.logo ? (
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              width={36}
                              height={36}
                              // The grey behind it holds the square while a
                              // new page's logos load, so rows don't flash.
                              className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-gray-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <BiPurchaseTagAlt size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                              {brand.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">
                              /{brand.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleTop(brand)}
                          disabled={savingTopId === brand._id}
                          aria-pressed={Boolean(brand.isTopBrand)}
                          title={
                            brand.isTopBrand
                              ? "Remove from top brands"
                              : "Mark as top brand"
                          }
                          className={`rounded p-1 transition-colors disabled:opacity-50 ${
                            brand.isTopBrand
                              ? "text-amber-500 hover:text-amber-600"
                              : "text-gray-300 hover:text-amber-500"
                          }`}
                        >
                          {brand.isTopBrand ? (
                            <BiSolidStar size={20} />
                          ) : (
                            <BiStar size={20} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm tabular-nums text-gray-700">
                          {brand.productCount ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm tabular-nums text-gray-700">
                          {brand.sortOrder}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            brand.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/products/brand/edit?id=${brand._id}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            title="Edit brand"
                          >
                            <BiPencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(brand)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete brand"
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
        {!loading && brands.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiPurchaseTagAlt size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No brands yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Create your first brand to start tagging products with it.
            </p>
          </div>
        )}

        {/* Brands exist, but none match the search / top-brands filter. */}
        {!loading && brands.length > 0 && visibleBrands.length === 0 && (
          <p className="bg-white py-12 text-center text-sm text-gray-500">
            {topOnly && !search.trim()
              ? "No top brands picked yet — click a brand's star to add it."
              : "No brands match your search."}
          </p>
        )}

        {!loading && visibleBrands.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={visibleBrands.length}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandList;
