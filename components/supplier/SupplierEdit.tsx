"use client";

import {
  Supplier,
  getSupplierAction,
  updateSupplierAction,
} from "@/app/actions/supplier";
import SupplierForm, { SupplierFormValues } from "./SupplierForm";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const SupplierEdit = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No supplier selected.");
      setLoading(false);
      return;
    }

    (async () => {
      const res = await getSupplierAction(id);
      if (res.ok && res.data) {
        setSupplier(res.data);
      } else {
        setError(res.error || "Supplier not found.");
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await updateSupplierAction(id, formData);
      if (res.ok) {
        toast.success("Supplier updated");
        router.push("/inventory/supplier");
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to update supplier",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: SupplierFormValues | undefined = supplier
    ? {
        name: supplier.name,
        contactPerson: supplier.contactPerson || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        website: supplier.website || "",
        description: supplier.description || "",
        isActive: supplier.isActive,
        sortOrder: String(supplier.sortOrder),
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Supplier</h1>
            <p className="text-sm text-gray-500 mt-1">Update this supplier</p>
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
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      ) : error || !supplier ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            {error || "Could not load this supplier."}
          </p>
          <Link
            href="/inventory/supplier"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={16} /> Back to Suppliers
          </Link>
        </div>
      ) : (
        <SupplierForm
          initialValues={initialValues}
          initialLogo={supplier.logo || ""}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/inventory/supplier")}
        />
      )}
    </div>
  );
};

export default SupplierEdit;
