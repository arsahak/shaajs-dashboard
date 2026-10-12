"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BiImageAdd } from "react-icons/bi";

export type BrandFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  isTopBrand: boolean;
  sortOrder: string;
};

export const EMPTY_BRAND_FORM: BrandFormValues = {
  name: "",
  description: "",
  isActive: true,
  isTopBrand: false,
  sortOrder: "0",
};

interface BrandFormProps {
  initialValues?: BrandFormValues;
  initialLogo?: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
  /** "compact" (default) is a single narrow column, used in a modal.
   * "page" is a wider two-column layout (main content + settings sidebar),
   * used on the standalone Add/Edit Brand pages. */
  layout?: "compact" | "page";
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";

const BrandForm = ({
  initialValues = EMPTY_BRAND_FORM,
  initialLogo = "",
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
  layout = "compact",
}: BrandFormProps) => {
  const [form, setForm] = useState<BrandFormValues>(initialValues);
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
    formData.set("description", form.description);
    formData.set("isActive", String(form.isActive));
    formData.set("isTopBrand", String(form.isTopBrand));
    formData.set("sortOrder", form.sortOrder);
    if (logoFile) formData.set("logo", logoFile);
    onSubmit(formData);
  };

  const logoField = (
    <div className="space-y-1.5">
      {layout === "compact" && <label className={labelClass}>Logo</label>}
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
  );

  const nameField = (
    <div className="space-y-1.5">
      <label className={labelClass}>
        Name <span className="text-red-500">*</span>
      </label>
      <input
        required
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className={inputClass}
      />
    </div>
  );

  const descriptionField = (
    <div className="space-y-1.5">
      <label className={labelClass}>Description</label>
      <textarea
        rows={layout === "page" ? 5 : 3}
        value={form.description}
        onChange={(e) =>
          setForm((f) => ({ ...f, description: e.target.value }))
        }
        className={`${inputClass} resize-none`}
      />
    </div>
  );

  const sortOrderField = (
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
  );

  const activeField = (
    <div className="space-y-1.5">
      <label className={labelClass}>Status</label>
      <select
        value={form.isActive ? "active" : "inactive"}
        onChange={(e) =>
          setForm((f) => ({ ...f, isActive: e.target.value === "active" }))
        }
        className={inputClass}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );

  const topBrandField = (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={form.isTopBrand}
        onChange={(e) =>
          setForm((f) => ({ ...f, isTopBrand: e.target.checked }))
        }
        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-black"
      />
      <span>
        <span className="block text-sm font-medium text-gray-900">
          Top brand
        </span>
        <span className="block text-xs text-gray-500">
          Feature this brand among the store&apos;s top brands.
        </span>
      </span>
    </label>
  );

  const actions = (
    <>
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
    </>
  );

  if (layout === "page") {
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
                {nameField}
                {descriptionField}
              </div>
            </div>
            <div className="rounded border border-gray-200 p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Logo
              </h3>
              {logoField}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded border border-gray-200 p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Organization
              </h3>
              <div className="space-y-4">
                {sortOrderField}
                {topBrandField}
              </div>
            </div>
            <div className="rounded border border-gray-200 p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Status
              </h3>
              {activeField}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
          {actions}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {logoField}
      {nameField}
      {descriptionField}
      {sortOrderField}
      {topBrandField}
      {activeField}
      <div className="flex justify-end gap-3 pt-2">{actions}</div>
    </form>
  );
};

export default BrandForm;
