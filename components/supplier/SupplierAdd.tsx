"use client";

import { createSupplierAction } from "@/app/actions/supplier";
import SupplierForm from "./SupplierForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const SupplierAdd = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const res = await createSupplierAction(formData);
      if (res.ok) {
        toast.success("Supplier created");
        router.push("/inventory/supplier");
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to create supplier",
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
            <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
            <p className="text-sm text-gray-500 mt-1">
              Register a new supplier to receive stock from
            </p>
          </div>
          <Link
            href="/inventory/supplier"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={18} />
            Back to Suppliers
          </Link>
        </div>
      </div>

      {/* Form */}
      <SupplierForm
        submitting={submitting}
        submitLabel="Create Supplier"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/inventory/supplier")}
      />
    </div>
  );
};

export default SupplierAdd;
