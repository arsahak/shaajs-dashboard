"use client";

import { Category } from "@/app/actions/category";
import SearchSelect from "@/components/shared/SearchSelect";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiFile,
  BiHide,
  BiImageAdd,
  BiLockAlt,
  BiMoney,
  BiPackage,
  BiPlus,
  BiShow,
  BiStore,
  BiX,
} from "react-icons/bi";

const MAX_BUSINESS_DOCS = 5;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export type VendorStatus = "active" | "pending" | "inactive" | "disabled";

export type VendorLevel = "verified" | "trusted" | "top_rated";

export type VendorOwnership = "own" | "third_party";

export type CategoryCommission = {
  category: string;
  rate: string;
};

export type VendorFormValues = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  socialLink: string;
  password: string;
  description: string;
  status: VendorStatus;
  level: VendorLevel;
  ownership: VendorOwnership;
  categories: string[];
  commissionRate: string;
  categoryCommissions: CategoryCommission[];
  commissionNotes: string;
};

export const EMPTY_VENDOR_FORM: VendorFormValues = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  socialLink: "",
  password: "",
  description: "",
  status: "active",
  level: "verified",
  ownership: "own",
  categories: [],
  commissionRate: "",
  categoryCommissions: [],
  commissionNotes: "",
};

const VENDOR_STATUSES: { value: VendorStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "disabled", label: "Disabled" },
];

const VENDOR_LEVELS: { value: VendorLevel; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "trusted", label: "Trusted" },
  { value: "top_rated", label: "Top Rated" },
];

interface VendorFormProps {
  /** System-wide product categories (from Products > Categories), used to
   * populate the commission-by-category dropdown. */
  systemCategories: Category[];
  initialValues?: VendorFormValues;
  initialLogo?: string;
  initialCoverImage?: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";


const VendorForm = ({
  systemCategories,
  initialValues = EMPTY_VENDOR_FORM,
  initialLogo = "",
  initialCoverImage = "",
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: VendorFormProps) => {
  const [form, setForm] = useState<VendorFormValues>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialLogo);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(initialCoverImage);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [categoryInput, setCategoryInput] = useState("");

  const [commissionCategory, setCommissionCategory] = useState("");
  const [commissionCategoryRate, setCommissionCategoryRate] = useState("");

  const [businessDocs, setBusinessDocs] = useState<File[]>([]);
  const businessDocsInputRef = useRef<HTMLInputElement>(null);

  const [agreementDoc, setAgreementDoc] = useState<File | null>(null);
  const agreementInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addCategory = () => {
    const value = categoryInput.trim();
    if (!value) return;
    setForm((f) =>
      f.categories.some((c) => c.toLowerCase() === value.toLowerCase())
        ? f
        : { ...f, categories: [...f.categories, value] },
    );
    setCategoryInput("");
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCategory();
    }
  };

  const removeCategory = (value: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.filter((c) => c !== value),
    }));
  };

  const addCategoryCommission = () => {
    if (!commissionCategory || !commissionCategoryRate) return;
    setForm((f) => ({
      ...f,
      categoryCommissions: [
        ...f.categoryCommissions.filter(
          (cc) => cc.category !== commissionCategory,
        ),
        { category: commissionCategory, rate: commissionCategoryRate },
      ],
    }));
    setCommissionCategory("");
    setCommissionCategoryRate("");
  };

  const removeCategoryCommission = (category: string) => {
    setForm((f) => ({
      ...f,
      categoryCommissions: f.categoryCommissions.filter(
        (cc) => cc.category !== category,
      ),
    }));
  };

  const handleBusinessDocsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const slotsLeft = MAX_BUSINESS_DOCS - businessDocs.length;
    const accepted = files.slice(0, slotsLeft);
    if (files.length > accepted.length) {
      toast.error(`You can add up to ${MAX_BUSINESS_DOCS} files.`);
    }
    if (accepted.length > 0) {
      setBusinessDocs((prev) => [...prev, ...accepted]);
    }
    if (businessDocsInputRef.current) businessDocsInputRef.current.value = "";
  };

  const removeBusinessDoc = (index: number) => {
    setBusinessDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAgreementDoc(file);
    if (agreementInputRef.current) agreementInputRef.current.value = "";
  };

  const removeAgreementDoc = () => {
    setAgreementDoc(null);
    if (agreementInputRef.current) agreementInputRef.current.value = "";
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
    formData.set("socialLink", form.socialLink);
    if (form.password) formData.set("password", form.password);
    formData.set("description", form.description);
    formData.set("categories", JSON.stringify(form.categories));
    formData.set("commissionRate", form.commissionRate);
    formData.set(
      "categoryCommissions",
      JSON.stringify(form.categoryCommissions),
    );
    formData.set("commissionNotes", form.commissionNotes);
    formData.set("level", form.level);
    formData.set("ownership", form.ownership);
    formData.set("status", form.status);
    if (logoFile) formData.set("logo", logoFile);
    if (coverFile) formData.set("coverImage", coverFile);
    if (agreementDoc) formData.set("agreementDocument", agreementDoc);
    businessDocs.forEach((file) => formData.append("businessDocuments", file));
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
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. Aqua Supplies Co."
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Contact Person</label>
                <input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPerson: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Name of the primary contact"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Address &amp; Website
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Address</label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={`${inputClass} resize-none`}
                  placeholder="Street, city, country"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="space-y-1.5">
                  <label className={labelClass}>Facebook / Social Media</label>
                  <input
                    type="url"
                    value={form.socialLink}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, socialLink: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Description
            </h3>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={`${inputClass} resize-none`}
              placeholder="Notes about this vendor — what they supply, terms, etc."
            />
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Logo &amp; Cover Image
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary hover:text-primary transition-colors"
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
                  </div>
                  <input
                    ref={logoInputRef}
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

              <div className="space-y-1.5">
                <label className={labelClass}>Cover Image</label>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  {coverPreview ? (
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      width={320}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <BiImageAdd size={24} />
                      <span className="text-xs">Upload a banner</span>
                    </span>
                  )}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  Wide banner shown on the vendor&apos;s detail page.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Business Documents
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className={labelClass}>Agreement Document</label>
              <p className="mb-1.5 mt-1 flex-1 text-xs text-gray-500">
                Signed vendor agreement or contract.
              </p>
              {agreementDoc ? (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400">
                    <BiFile size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {agreementDoc.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(agreementDoc.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeAgreementDoc}
                    className="shrink-0 text-gray-400 hover:text-red-500"
                    aria-label="Remove agreement document"
                  >
                    <BiX size={18} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => agreementInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
                >
                  <BiPlus size={18} />
                  Upload Agreement Document
                </button>
              )}
              <input
                ref={agreementInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleAgreementChange}
                className="hidden"
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Other Documents</label>
              <p className="mb-1.5 mt-1 flex-1 text-xs text-gray-500">
                Trade license, ID, etc. — images, PDF, or Word docs. Up to{" "}
                {MAX_BUSINESS_DOCS} files, {businessDocs.length}/
                {MAX_BUSINESS_DOCS} used.
              </p>

              {businessDocs.length > 0 && (
                <div className="mb-3 space-y-2">
                  {businessDocs.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400">
                        <BiFile size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBusinessDoc(i)}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${file.name}`}
                      >
                        <BiX size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {businessDocs.length < MAX_BUSINESS_DOCS && (
                <button
                  type="button"
                  onClick={() => businessDocsInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
                >
                  <BiPlus size={18} />
                  Add Files
                </button>
              )}
              <input
                ref={businessDocsInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleBusinessDocsChange}
                className="hidden"
              />
            </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <BiPackage size={16} className="text-gray-400" />
              Product Categories / Type
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              What kind of products does this vendor supply? Type a category
              and press Enter to add it.
            </p>
            <div className="flex gap-2">
              <input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                className={inputClass}
                placeholder="e.g. Live Fish, Filters"
              />
              <button
                type="button"
                onClick={addCategory}
                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add
              </button>
            </div>
            {form.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.categories.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCategory(c)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Remove ${c}`}
                    >
                      <BiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <BiMoney size={16} className="text-gray-400" />
              Commission Policy
            </h3>

            <div className="space-y-1.5">
              <label className={labelClass}>Flat Commission (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.commissionRate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      commissionRate: e.target.value,
                    }))
                  }
                  className={`${inputClass} pr-8`}
                  placeholder="e.g. 10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <label className={labelClass}>Category Wise</label>

              {systemCategories.length === 0 ? (
                <p className="mt-1.5 text-xs text-gray-500">
                  No product categories yet.
                </p>
              ) : (
                <div className="mt-1.5 space-y-3">
                  <div className="flex gap-2">
                    <SearchSelect
                      options={systemCategories.map((c) => ({
                        id: c.name,
                        label: c.name,
                      }))}
                      value={commissionCategory}
                      onChange={setCommissionCategory}
                      placeholder="Search category…"
                      emptyText="No categories found."
                      className="flex-1"
                    />
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={commissionCategoryRate}
                        onChange={(e) =>
                          setCommissionCategoryRate(e.target.value)
                        }
                        className={`${inputClass} pr-6`}
                        placeholder="%"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        %
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addCategoryCommission}
                      disabled={!commissionCategory || !commissionCategoryRate}
                      className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>

                  {form.categoryCommissions.length > 0 && (
                    <div className="space-y-2">
                      {form.categoryCommissions.map((cc) => (
                        <div
                          key={cc.category}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                        >
                          <span className="truncate text-sm font-medium text-gray-900">
                            {cc.category}
                          </span>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">
                              {cc.rate}%
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeCategoryCommission(cc.category)
                              }
                              className="text-gray-400 hover:text-red-500"
                              aria-label={`Remove ${cc.category} commission`}
                            >
                              <BiX size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1.5">
              <label className={labelClass}>Terms / Notes</label>
              <textarea
                rows={3}
                value={form.commissionNotes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    commissionNotes: e.target.value,
                  }))
                }
                className={`${inputClass} resize-none`}
                placeholder="e.g. Payout monthly, 15 days after invoice"
              />
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Status &amp; Level
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Visibility</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as VendorStatus,
                    }))
                  }
                  className={inputClass}
                >
                  {VENDOR_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Vendor Level</label>
                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      level: e.target.value as VendorLevel,
                    }))
                  }
                  className={inputClass}
                >
                  {VENDOR_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Vendor Type</label>
                <div className="flex gap-2">
                  <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.ownership === "own"}
                      onChange={() =>
                        setForm((f) => ({ ...f, ownership: "own" }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Own Vendor
                  </label>
                  <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.ownership === "third_party"}
                      onChange={() =>
                        setForm((f) => ({ ...f, ownership: "third_party" }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Third-Party
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-dashed border-gray-200 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
              <BiStore size={20} />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Vendor details are internal-only and never shown in the
              storefront.
            </p>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <BiLockAlt size={16} className="text-gray-400" />
              Vendor Dashboard Login
            </h3>
            <div className="space-y-1.5">
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={`${inputClass} pr-10`}
                  placeholder="Set a login password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <BiHide size={18} /> : <BiShow size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Leave blank to keep it unchanged.
              </p>
            </div>
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

export default VendorForm;
