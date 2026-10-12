"use client";

import { Brand, getBrandAction, updateBrandAction } from "@/app/actions/brand";
import BrandForm, { BrandFormValues } from "./BrandForm";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const BrandEdit = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No brand selected.");
      setLoading(false);
      return;
    }

    (async () => {
      const res = await getBrandAction(id);
      if (res.ok && res.data) {
        setBrand(res.data);
      } else {
        setError(res.error || "Brand not found.");
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await updateBrandAction(id, formData);
      if (res.ok) {
        toast.success("Brand updated");
        router.push("/products/brand");
      } else {
        toast.error(res.error || "Failed to update brand");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: BrandFormValues | undefined = brand
    ? {
        name: brand.name,
        description: brand.description || "",
        isActive: brand.isActive,
        isTopBrand: Boolean(brand.isTopBrand),
        sortOrder: String(brand.sortOrder),
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Brand</h1>
            <p className="text-sm text-gray-500 mt-1">Update this brand</p>
          </div>
          <Link
            href="/products/brand"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={18} />
            Back to Brands
          </Link>
        </div>
      </div>

      {/* Form */}
      {loading ? (
        <div className="rounded border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {Array.from({ length: 2 }).map((_, i) => (
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
      ) : error || !brand ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            {error || "Could not load this brand."}
          </p>
          <Link
            href="/products/brand"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={16} /> Back to Brands
          </Link>
        </div>
      ) : (
        <BrandForm
          layout="page"
          initialValues={initialValues}
          initialLogo={brand.logo || ""}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/products/brand")}
        />
      )}
    </div>
  );
};

export default BrandEdit;
