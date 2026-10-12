"use client";

import {
  Category,
  deleteCategoryAction,
  listCategoriesAction,
} from "@/app/actions/category";
import Pagination from "@/components/shared/Pagination";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiCategory,
  BiCheckCircle,
  BiLayer,
  BiPencil,
  BiPlus,
  BiSearch,
  BiTrash,
  BiXCircle,
} from "react-icons/bi";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// The two dropdowns on the right of the table's toolbar.
const FILTER_OPTIONS = [
  { value: "all", label: "All categories" },
  { value: "parents", label: "Parent categories" },
  { value: "children", label: "Subcategories" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

const SORT_OPTIONS = [
  { value: "sortOrder", label: "Sort order" },
  { value: "nameAsc", label: "Name (A–Z)" },
  { value: "nameDesc", label: "Name (Z–A)" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const selectClass =
  "rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

const CategoryDetailsView = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("sortOrder");
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await listCategoriesAction();
    if (res.ok && res.data) {
      setCategories(res.data);
    } else {
      toast.error(res.error || "Failed to load categories");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c._id, c])),
    [categories],
  );

  // Each category's name together with its parents' ("makeup face makeup
  // foundation"), so searching a department also finds everything under it.
  const searchTextById = useMemo(() => {
    const text = new Map<string, string>();
    for (const category of categories) {
      const names = [category.name];
      let parent = category.parent
        ? categoryById.get(category.parent)
        : undefined;
      // The length check guards against a parent loop in the data.
      while (parent && names.length < 20) {
        names.push(parent.name);
        parent = parent.parent ? categoryById.get(parent.parent) : undefined;
      }
      text.set(category._id, names.join(" ").toLowerCase());
    }
    return text;
  }, [categories, categoryById]);

  // What the table shows: the search and the filter narrow the full list,
  // the sort orders what is left, and that is then paged.
  const visibleCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matching = categories.filter((c) => {
      if (term && !(searchTextById.get(c._id) ?? "").includes(term)) {
        return false;
      }
      switch (filter) {
        case "parents":
          return !c.parent;
        case "children":
          return Boolean(c.parent);
        case "active":
          return c.isActive;
        case "inactive":
          return !c.isActive;
        default:
          return true;
      }
    });

    // "Sort order" is the order the list arrives in from the server.
    if (sort === "sortOrder") return matching;
    const byName = (a: Category, b: Category) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    const byDate = (a: Category, b: Category) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    const sorted = [...matching];
    if (sort === "nameAsc") sorted.sort(byName);
    else if (sort === "nameDesc") sorted.sort((a, b) => byName(b, a));
    else if (sort === "newest") sorted.sort((a, b) => byDate(b, a));
    else sorted.sort(byDate);
    return sorted;
  }, [categories, search, searchTextById, filter, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleCategories.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedCategories = useMemo(
    () =>
      visibleCategories.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [visibleCategories, currentPage, pageSize],
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
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const inactiveCategories = categories.filter((c) => !c.isActive).length;
  const subcategories = categories.filter((c) => !!c.parent).length;

  const stats = [
    {
      title: "Total Categories",
      value: totalCategories,
      subtitle: "All product categories",
      icon: <BiCategory size={20} />,
      color: "bg-primary/10",
      iconColor: "text-primary-dark",
    },
    {
      title: "Active",
      value: activeCategories,
      subtitle: "Visible in the storefront",
      icon: <BiCheckCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Inactive",
      value: inactiveCategories,
      subtitle: "Hidden from customers",
      icon: <BiXCircle size={20} />,
      color: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Subcategories",
      value: subcategories,
      subtitle: "Nested under a parent",
      icon: <BiLayer size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"? This cannot be undone.`))
      return;

    const res = await deleteCategoryAction(category._id);
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
      toast.success("Category deleted");
    } else {
      toast.error(res.error || "Failed to delete category");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">
              Organize your products into categories and subcategories
            </p>
          </div>
          <Link
            href="/products/categories/add"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiPlus size={18} />
            Add Category
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

      {/* Categories Table */}
      <div
        ref={tableRef}
        className="scroll-mt-4 rounded border border-gray-200 bg-white overflow-hidden"
      >
        {/* Left: find a category by its name, or by the name of a parent.
            Right: which categories to show, and in what order. */}
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
              placeholder="Search categories…"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter categories"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as FilterValue);
                setPage(1);
              }}
              className={selectClass}
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort categories"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortValue);
                setPage(1);
              }}
              className={selectClass}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Parent
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
                        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>
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
                : paginatedCategories.map((category) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={category.name}
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <BiCategory size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                              {category.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">
                              /{category.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {category.parent
                            ? categoryById.get(category.parent)?.name || "—"
                            : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {category.sortOrder}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            category.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/products/categories/edit?id=${category._id}`}
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            title="Edit category"
                          >
                            <BiPencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(category)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete category"
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
        {!loading && categories.length === 0 && (
          <div className="text-center py-20 bg-white">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BiCategory size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No categories yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Create your first category to start organizing products.
            </p>
          </div>
        )}

        {/* Categories exist, but none match the search. */}
        {!loading && categories.length > 0 && visibleCategories.length === 0 && (
          <p className="bg-white py-12 text-center text-sm text-gray-500">
            No categories match your search or filter.
          </p>
        )}

        {!loading && visibleCategories.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={visibleCategories.length}
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

export default CategoryDetailsView;
