"use client";

import { Category, listCategoriesAction } from "@/app/actions/category";
import { createVendorAction } from "@/app/actions/vendors";
import VendorForm from "./VendorForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const VendorAdd = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await listCategoriesAction();
      if (res.ok && res.data) setCategories(res.data);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const res = await createVendorAction(formData);
      if (res.ok) {
        toast.success("Vendor created");
        router.push("/vendors");
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to create vendor",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Vendor</h1>
            <p className="text-sm text-gray-500 mt-1">
              Register a new vendor for your catalog
            </p>
          </div>
          <Link
            href="/vendors"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={18} />
            Back to Vendors
          </Link>
        </div>
      </div>

      {/* Form */}
      {loading ? (
        <div className="rounded border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-gray-100 animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-4 lg:col-span-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <VendorForm
          systemCategories={categories}
          submitting={submitting}
          submitLabel="Create Vendor"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/vendors")}
        />
      )}
    </div>
  );
};

export default VendorAdd;
