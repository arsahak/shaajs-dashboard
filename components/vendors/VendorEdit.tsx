"use client";

import { Category, listCategoriesAction } from "@/app/actions/category";
import {
  Vendor,
  getVendorAction,
  updateVendorAction,
} from "@/app/actions/vendors";
import VendorForm, { VendorFormValues } from "./VendorForm";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const VendorEdit = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No vendor selected.");
      setLoading(false);
      return;
    }

    (async () => {
      const [vendorRes, categoriesRes] = await Promise.all([
        getVendorAction(id),
        listCategoriesAction(),
      ]);
      if (vendorRes.ok && vendorRes.data) {
        setVendor(vendorRes.data);
      } else {
        setError(vendorRes.error || "Vendor not found.");
      }
      if (categoriesRes.ok && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await updateVendorAction(id, formData);
      if (res.ok) {
        toast.success("Vendor updated");
        router.push("/vendors");
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to update vendor",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: VendorFormValues | undefined = vendor
    ? {
        name: vendor.name,
        contactPerson: vendor.contactPerson || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        website: vendor.website || "",
        socialLink: vendor.socialLink || "",
        // Passwords are never returned by the API — always starts blank
        // (kept unchanged unless the admin sets a new one).
        password: "",
        description: vendor.description || "",
        status: vendor.status,
        level: vendor.level,
        ownership: vendor.ownership,
        categories: vendor.categories || [],
        commissionRate:
          vendor.commissionRate !== undefined
            ? String(vendor.commissionRate)
            : "",
        categoryCommissions: (vendor.categoryCommissions || []).map((cc) => ({
          category: cc.category,
          rate: String(cc.rate),
        })),
        commissionNotes: vendor.commissionNotes || "",
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vendor</h1>
            <p className="text-sm text-gray-500 mt-1">Update this vendor</p>
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
      ) : error || !vendor ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            {error || "Could not load this vendor."}
          </p>
          <Link
            href="/vendors"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={16} /> Back to Vendors
          </Link>
        </div>
      ) : (
        <VendorForm
          systemCategories={categories}
          initialValues={initialValues}
          initialLogo={vendor.logo?.url || ""}
          initialCoverImage={vendor.coverImage?.url || ""}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/vendors")}
        />
      )}
    </div>
  );
};

export default VendorEdit;
