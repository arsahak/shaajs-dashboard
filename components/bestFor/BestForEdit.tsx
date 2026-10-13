"use client";

import {
  BestFor,
  listBestForAction,
  updateBestForAction,
} from "@/app/actions/bestFor";
import { BEST_FOR_COLOR_PAIRS, type BestForColors } from "@/lib/bestForColors";
import BestForForm, { BestForFormValues } from "./BestForForm";
import { DEFAULT_BEST_FOR_ICON } from "./BestForIcon";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const LIST_HREF = "/products/best-for";

const BestForEdit = () => {
  const router = useRouter();
  const id = useSearchParams().get("id");

  // The whole list: the entry being edited is in it, along with the groups
  // it could be moved to and whether it has options of its own.
  const [entries, setEntries] = useState<BestFor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Nothing selected.");
      setLoading(false);
      return;
    }

    (async () => {
      const res = await listBestForAction();
      if (res.ok && res.data) {
        setEntries(res.data);
        if (!res.data.some((entry) => entry._id === id)) {
          setError("Entry not found.");
        }
      } else {
        setError(res.error || "Could not load the list.");
      }
      setLoading(false);
    })();
  }, [id]);

  const entry = entries.find((item) => item._id === id);
  const hasOptions = entries.some((item) => item.parent === id);
  // Every group but the entry itself.
  const groups = entries.filter((item) => !item.parent && item._id !== id);

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await updateBestForAction(id, formData);
      if (res.ok) {
        toast.success(
          formData.get("parent") ? "Option updated" : "Group updated",
        );
        router.push(LIST_HREF);
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to update",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: BestForFormValues | undefined = entry
    ? {
        name: entry.name,
        parent: entry.parent || "",
        icon: entry.icon || DEFAULT_BEST_FOR_ICON,
        colors:
          entry.colors?.length === 2
            ? (entry.colors as BestForColors)
            : BEST_FOR_COLOR_PAIRS[0],
        isActive: entry.isActive,
        sortOrder: String(entry.sortOrder),
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Best For
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {entry
                ? entry.parent
                  ? "Update this option"
                  : "Update this group"
                : "Update this entry"}
            </p>
          </div>
          <Link
            href={LIST_HREF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={18} />
            Back to Best For
          </Link>
        </div>
      </div>

      {/* Form */}
      {loading ? (
        <div className="rounded border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-40 rounded-lg bg-gray-100 animate-pulse lg:col-span-2" />
            <div className="h-40 rounded-lg bg-gray-100 animate-pulse lg:col-span-1" />
          </div>
        </div>
      ) : error || !entry ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            {error || "Could not load this entry."}
          </p>
          <Link
            href={LIST_HREF}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={16} /> Back to Best For
          </Link>
        </div>
      ) : (
        <BestForForm
          initialValues={initialValues}
          initialImage={entry.image || ""}
          groups={groups}
          lockParent={hasOptions}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push(LIST_HREF)}
        />
      )}
    </div>
  );
};

export default BestForEdit;
