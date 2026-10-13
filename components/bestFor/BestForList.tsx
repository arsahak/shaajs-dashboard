"use client";

import {
  BestFor,
  deleteBestForAction,
  listBestForAction,
} from "@/app/actions/bestFor";
import BestForIcon from "@/components/bestFor/BestForIcon";
import { bestForGradient } from "@/lib/bestForColors";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiCheckCircle,
  BiChevronDown,
  BiListUl,
  BiPencil,
  BiPlus,
  BiSearch,
  BiTargetLock,
  BiTrash,
} from "react-icons/bi";

const ADD_HREF = "/products/best-for/add";
const editHref = (id: string) => `/products/best-for/edit?id=${id}`;

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-medium ${
      active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

// An entry's card in miniature: its picture on its background gradient with
// a little space around it, or its icon when it has no picture.
const CardThumb = ({ entry }: { entry: BestFor }) => (
  <span
    className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-black/5"
    style={{ backgroundImage: bestForGradient(entry.colors) }}
  >
    {entry.image ? (
      <Image
        src={entry.image}
        alt=""
        fill
        unoptimized
        sizes="36px"
        className="object-contain p-1"
      />
    ) : (
      <BestForIcon
        name={entry.icon}
        strokeWidth={1.75}
        className="absolute inset-0 m-auto size-5 text-white/80"
      />
    )}
  </span>
);

// The Best For list: every group as its own card, with the options in it
// listed underneath — the options being what products get tagged with.
const BestForList = () => {
  const [entries, setEntries] = useState<BestFor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // The groups opened by hand; the rest show only their header, so a long
  // list stays a page of group names. A search opens whatever it finds.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  const toggleGroup = (id: string) =>
    setOpenGroups((open) => {
      const next = new Set(open);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await listBestForAction();
    if (res.ok && res.data) {
      setEntries(res.data);
    } else {
      toast.error(res.error || "Failed to load the Best For list");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  // Groups in their saved order, each with its options. With a search, a
  // group stays if its own name matches (showing all its options) or if any
  // of its options do (showing just those).
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((entry) => !entry.parent)
      .map((group) => {
        const options = entries.filter((entry) => entry.parent === group._id);
        const groupMatches = group.name.toLowerCase().includes(query);
        return {
          group,
          total: options.length,
          options:
            !query || groupMatches
              ? options
              : options.filter((option) =>
                  option.name.toLowerCase().includes(query),
                ),
          matches: !query || groupMatches,
        };
      })
      .filter(({ matches, options }) => matches || options.length > 0);
  }, [entries, search]);

  const groupCount = entries.filter((entry) => !entry.parent).length;
  const optionCount = entries.length - groupCount;
  const activeOptionCount = entries.filter(
    (entry) => entry.parent && entry.isActive,
  ).length;

  const stats = [
    {
      title: "Groups",
      value: groupCount,
      subtitle: "Kinds of thing described",
      icon: <BiListUl size={20} />,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Options",
      value: optionCount,
      subtitle: "What products are tagged with",
      icon: <BiTargetLock size={20} />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Active Options",
      value: activeOptionCount,
      subtitle: "Offered on the product form",
      icon: <BiCheckCircle size={20} />,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  const handleDelete = async (entry: BestFor, optionTotal = 0) => {
    const message = entry.parent
      ? `Delete option "${entry.name}"? It will be taken off every product tagged with it. This cannot be undone.`
      : optionTotal > 0
        ? `Delete group "${entry.name}" and its ${optionTotal} option${optionTotal === 1 ? "" : "s"}? They will be taken off every product tagged with them. This cannot be undone.`
        : `Delete group "${entry.name}"? This cannot be undone.`;
    if (!confirm(message)) return;

    const res = await deleteBestForAction(entry._id);
    if (res.ok) {
      toast.success(entry.parent ? "Option deleted" : "Group deleted");
      void fetchEntries();
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Best For</h1>
            <p className="text-sm text-gray-500 mt-1">
              Who or what a product is best for — Dry Skin, Men, Brightening.
              Make groups, add options to them, then tag products with the
              options.
            </p>
          </div>
          <Link
            href={ADD_HREF}
            className="flex shrink-0 items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <BiPlus size={18} />
            Add Group
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.title}
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

      {/* Search */}
      <div className="rounded border border-gray-200 bg-white px-6 py-4">
        <div className="relative w-full max-w-xs">
          <BiSearch
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups and options…"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Groups */}
      {loading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded border border-gray-200 bg-white p-6"
          >
            <div className="h-full rounded-lg bg-gray-100 animate-pulse" />
          </div>
        ))
      ) : groups.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <BiTargetLock size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {groupCount === 0 ? "Nothing here yet" : "No matches"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {groupCount === 0
              ? "Start with a group — Skin Type, Concern, For — then add its options."
              : "No group or option matches your search."}
          </p>
          {groupCount === 0 && (
            <Link
              href={ADD_HREF}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
            >
              <BiPlus size={18} />
              Add Group
            </Link>
          )}
        </div>
      ) : (
        groups.map(({ group, options, total }) => {
          const open = search.trim() !== "" || openGroups.has(group._id);
          return (
          <div
            key={group._id}
            className="rounded border border-gray-200 bg-white overflow-hidden"
          >
            {/* The group — click its name to show or hide its options */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-6 py-4 ${
                open ? "border-b border-gray-200" : ""
              }`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggleGroup(group._id)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <BiChevronDown
                  size={20}
                  className={`shrink-0 text-gray-400 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
                <CardThumb entry={group} />
                <h2 className="truncate text-base font-semibold text-gray-900">
                  {group.name}
                </h2>
                <StatusBadge active={group.isActive} />
                <span className="text-xs text-gray-500">
                  {total} option{total === 1 ? "" : "s"}
                </span>
              </button>
              <div className="flex items-center gap-3">
                <Link
                  href={`${ADD_HREF}?parent=${group._id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BiPlus size={16} />
                  Add Option
                </Link>
                <Link
                  href={editHref(group._id)}
                  className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                  title="Edit group"
                >
                  <BiPencil size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(group, total)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Delete group"
                >
                  <BiTrash size={18} />
                </button>
              </div>
            </div>

            {/* Its options */}
            {!open ? null : options.length === 0 ? (
              <p className="px-6 py-6 text-sm text-gray-500">
                No options in this group yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Option
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {options.map((option) => (
                      <tr key={option._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <CardThumb entry={option} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {option.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {option.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="text-sm tabular-nums text-gray-700">
                            {option.productCount ?? 0}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="text-sm tabular-nums text-gray-700">
                            {option.sortOrder}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <StatusBadge active={option.isActive} />
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={editHref(option._id)}
                              className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                              title="Edit option"
                            >
                              <BiPencil size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(option)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Delete option"
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
            )}
          </div>
          );
        })
      )}
    </div>
  );
};

export default BestForList;
