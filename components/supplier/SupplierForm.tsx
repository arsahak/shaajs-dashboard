"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BiImageAdd } from "react-icons/bi";

export type SupplierFormValues = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  isActive: boolean;
  sortOrder: string;
};

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  description: "",
  isActive: true,
  sortOrder: "0",
};

interface SupplierFormProps {
  initialValues?: SupplierFormValues;
  initialLogo?: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";

const SupplierForm = ({
  initialValues = EMPTY_SUPPLIER_FORM,
  initialLogo = "",
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: SupplierFormProps) => {
  const [form, setForm] = useState<SupplierFormValues>(initialValues);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("contactPerson", form.contactPerson);
    formData.set("email", form.email);
    formData.set("phone", form.phone);
    formData.set("address", form.address);
    formData.set("website", form.website);
    formData.set("description", form.description);
    formData.set("isActive", String(form.isActive));
    formData.set("sortOrder", form.sortOrder);
    if (logoFile) formData.set("logo", logoFile);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Contact Person</label>
                <input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPerson: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Logo</h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BiImageAdd size={24} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleLogoChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                JPEG, PNG, WEBP, or GIF. Max 5MB.
              </p>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Organization
            </h3>
            <div className="space-y-1.5">
              <label className={labelClass}>Sort Order</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Status
            </h3>
            <select
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isActive: e.target.value === "active",
                }))
              }
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
