"use client";

import {
  BestFor,
  createBestForAction,
  listBestForAction,
} from "@/app/actions/bestFor";
import { randomBestForColors } from "@/lib/bestForColors";
import BestForForm, { EMPTY_BEST_FOR_FORM } from "./BestForForm";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const LIST_HREF = "/products/best-for";

const BestForAdd = () => {
  const router = useRouter();
  // "?parent=<group id>" — the list's "Add option" link — opens the form
  // with that group already chosen.
  const presetParent = useSearchParams().get("parent") ?? "";

  const [groups, setGroups] = useState<BestFor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await listBestForAction();
      if (res.ok && res.data) {
        setGroups(res.data.filter((entry) => !entry.parent));
      }
      setLoading(false);
    })();
  }, []);

  // A new entry starts on one of the gradients, picked at random — it can be
  // changed in the form.
  const startingColors = useMemo(() => randomBestForColors(), []);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const res = await createBestForAction(formData);
      if (res.ok) {
        toast.success(formData.get("parent") ? "Option added" : "Group created");
        router.push(LIST_HREF);
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to create",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const parent = groups.some((group) => group._id === presetParent)
    ? presetParent
    : "";

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Best For</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a group, or add an option to one
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
      ) : (
        <BestForForm
          initialValues={{
            ...EMPTY_BEST_FOR_FORM,
            parent,
            // An option added from a group's "Add Option" starts on that
            // group's icon.
            icon:
              groups.find((group) => group._id === parent)?.icon ||
              EMPTY_BEST_FOR_FORM.icon,
            colors: startingColors,
          }}
          groups={groups}
          submitting={submitting}
          submitLabel={parent ? "Add Option" : "Create"}
          onSubmit={handleSubmit}
          onCancel={() => router.push(LIST_HREF)}
        />
      )}
    </div>
  );
};

export default BestForAdd;
