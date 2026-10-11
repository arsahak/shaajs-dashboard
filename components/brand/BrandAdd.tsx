"use client";

import { createBrandAction } from "@/app/actions/brand";
import BrandForm from "./BrandForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const BrandAdd = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const res = await createBrandAction(formData);
      if (res.ok) {
        toast.success("Brand created");
        router.push("/products/brand");
      } else {
        toast.error(res.error || "Failed to create brand");
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
            <h1 className="text-2xl font-bold text-gray-900">Add Brand</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new product brand
            </p>
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
      <BrandForm
        layout="page"
        submitting={submitting}
        submitLabel="Create Brand"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/products/brand")}
      />
    </div>
  );
};

export default BrandAdd;
