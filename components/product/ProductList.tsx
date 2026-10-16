"use client";

import {
  Product,
  ProductCategoryRef,
  ListProductsParams,
  ProductSort,
  deleteProductAction,
  listProductsAction,
} from "@/app/actions/product";
import Pagination from "@/components/shared/Pagination";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiBox,
  BiCheckCircle,
  BiPackage,
  BiPencil,
  BiPlus,
  BiSearch,
  BiStar,
  BiTrash,
  BiXCircle,
} from "react-icons/bi";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "default", label: "Default order" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "stock-low", label: "Stock: low to high" },
  { value: "stock-high", label: "Stock: high to low" },
];

const currency = (value: number) =>
  `৳${value.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

// The product flags the list can be narrowed to — the same ones as the
// product form's "Visibility & Flags".
type ProductFlag =
  | "isFeatured"
  | "isTrending"
  | "isBestSeller"
  | "isFreeDelivery"
  | "isNewArrival";

const FLAG_OPTIONS: { value: ProductFlag | ""; label: string }[] = [
  { value: "", label: "All products" },
  { value: "isFeatured", label: "Featured" },
  { value: "isTrending", label: "Trending" },
  { value: "isBestSeller", label: "Best Seller" },
  { value: "isFreeDelivery", label: "Free Delivery" },
  { value: "isNewArrival", label: "New Arrival" },
];

const categoryName = (category: Product["category"]): string =>
  typeof category === "string"
    ? "—"
    : (category as ProductCategoryRef)?.name || "—";

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [matchCount, setMatchCount] = useState(0);

  // The search box drives the list a moment after typing stops, not on
  // every keystroke.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<ProductSort>("default");
  const [flag, setFlag] = useState<ProductFlag | "">("");

  // Cheap counts (limit: 1 — only the `total` from each response is used) so
  // the stat cards reflect the whole catalog — not the current page, and not
  // what the search narrowed it to.
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [inactiveProducts, setInactiveProducts] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState(0);

  // Typing fires requests that can come back out of order — only the latest
  // one is allowed to fill the table.
  const latestRequest = useRef(0);

  const fetchProducts = useCallback(
    async (
      targetPage: number,
      term: string,
      order: ProductSort,
      onlyFlag: ProductFlag | "",
    ) => {
      const requestId = ++latestRequest.current;
      setLoading(true);
      const params: ListProductsParams = {
        page: targetPage,
        limit: PAGE_SIZE,
        search: term || undefined,
        sort: order,
      };
      if (onlyFlag) params[onlyFlag] = true;
      const res = await listProductsAction(params);
      if (requestId !== latestRequest.current) return;

      if (res.ok && res.data) {
        setProducts(res.data.products);
        setMatchCount(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error || "Failed to load products");
      }
      setLoading(false);
    },
    [],
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const [allRes, activeRes, inactiveRes, featuredRes] = await Promise.all([
      listProductsAction({ limit: 1 }),
      listProductsAction({ limit: 1, isActive: true }),
      listProductsAction({ limit: 1, isActive: false }),
      listProductsAction({ limit: 1, isFeatured: true }),
    ]);
    if (allRes.ok && allRes.data) setTotalProducts(allRes.data.total);
    if (activeRes.ok && activeRes.data) setActiveProducts(activeRes.data.total);
    if (inactiveRes.ok && inactiveRes.data) {
      setInactiveProducts(inactiveRes.data.total);
    }
    if (featuredRes.ok && featuredRes.data) {
      setFeaturedProducts(featuredRes.data.total);
    }
    setStatsLoading(false);
  }, []);

  // A new search starts again from the first page.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const term = search.trim();
      if (term === debouncedSearch) return;
      setDebouncedSearch(term);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search, debouncedSearch]);

  useEffect(() => {
    fetchProducts(page, debouncedSearch, sort, flag);
  }, [fetchProducts, page, debouncedSearch, sort, flag]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const currentPage = page;
  const paginatedProducts = products;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      subtitle: "All catalog items",
      icon: <BiPackage size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Active",
      value: activeProducts,
      subtitle: "Visible in the storefront",
      icon: <BiCheckCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Inactive",
      value: inactiveProducts,
      subtitle: "Hidden from customers",
      icon: <BiXCircle size={20} />,
      color: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Featured",
      value: featuredProducts,
      subtitle: "Highlighted products",
      icon: <BiStar size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete product "${product.title}"? This cannot be undone.`))
      return;

    const res = await deleteProductAction(product._id);
    if (res.ok) {
      toast.success("Product deleted");
      // Re-fetch so totals/pagination stay in sync with the server rather
      // than just splicing the deleted row out of the current page locally.
      const isLastRowOnPage = products.length === 1 && page > 1;
      if (isLastRowOnPage) setPage(page - 1);
      else fetchProducts(page, debouncedSearch, sort, flag);
      fetchStats();
    } else {
      toast.error(res.error || "Failed to delete product");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your aquarium product catalog
            </p>
          </div>
          <Link
            href="/products/add"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiPlus size={18} />
            Add Product
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

      {/* Products Table */}
      <div className="rounded border border-gray-200 bg-white overflow-hidden">
        {/* Search on the left, flag filter and sort on the right */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <BiSearch
              className="absolute left-3 top-3 text-gray-400"
              size={17}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU, category or brand"
              className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            {(debouncedSearch || flag) && !loading && (
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {matchCount} found
              </span>
            )}
            <select
              value={flag}
              onChange={(event) => {
                setFlag(event.target.value as ProductFlag | "");
                setPage(1);
              }}
              aria-label="Filter products"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-auto"
            >
              {FLAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ProductSort);
                setPage(1);
              }}
              aria-label="Sort products"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-auto"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stock
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
                        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-100 animate-pulse rounded"></div>
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
                : paginatedProducts.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex items-center gap-2.5 group"
                        >
                          {product.featureImage ? (
                            <Image
                              src={product.featureImage}
                              alt={product.title}
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <BiBox size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px] group-hover:underline">
                              {product.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">
                              {product.sku}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {categoryName(product.category)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.discountPrice ? (
                            <>
                              <span className="font-medium">
                                {currency(product.discountPrice)}
                              </span>{" "}
                              <span className="text-xs text-gray-400 line-through">
                                {currency(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium">
                              {currency(product.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            product.stock === 0
                              ? "text-red-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            product.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/products/edit?id=${product._id}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            title="Edit product"
                          >
                            <BiPencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete product"
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
        {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiPackage size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {debouncedSearch || flag ? "No products found" : "No products yet"}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {debouncedSearch || flag
                ? "Try a different search or filter."
                : "Add your first product to start building the catalog."}
            </p>
          </div>
        )}

        {!loading && products.length > 0 && totalPages > 1 && (
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

export default ProductList;
