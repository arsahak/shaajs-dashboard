"use client";

import {
  Vendor,
  VendorLevel,
  VendorStatus,
  deleteVendorAction,
  getVendorAction,
} from "@/app/actions/vendors";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiArrowBack,
  BiEnvelope,
  BiFile,
  BiGlobe,
  BiMoney,
  BiPencil,
  BiPhone,
  BiStore,
  BiTrash,
} from "react-icons/bi";

const STATUS_BADGE: Record<VendorStatus, string> = {
  active: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  inactive: "bg-gray-100 text-gray-600",
  disabled: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<VendorStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  disabled: "Disabled",
};

const LEVEL_LABEL: Record<VendorLevel, string> = {
  verified: "Verified",
  trusted: "Trusted",
  top_rated: "Top Rated",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const VendorDetails = () => {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(
    id ? null : "No vendor selected.",
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const res = await getVendorAction(id);
      if (res.ok && res.data) {
        setVendor(res.data);
      } else {
        setError(res.error || "Vendor not found.");
      }
      setLoading(false);
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!vendor) return;
    if (!confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`))
      return;

    setDeleting(true);
    const res = await deleteVendorAction(vendor._id);
    if (res.ok) {
      toast.success("Vendor deleted");
      router.push("/vendors");
    } else {
      toast.error(res.error || "Failed to delete vendor");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
        <div className="rounded border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-gray-100 animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-20 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="rounded border border-gray-200 bg-white p-6">
          <div className="h-32 w-full rounded-lg bg-gray-100 animate-pulse" />
          <div className="mt-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
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
      </div>
    );
  }

  const documents = [
    ...(vendor.agreementDocument
      ? [{ ...vendor.agreementDocument, label: "Agreement Document" }]
      : []),
    ...vendor.businessDocuments.map((doc) => ({
      ...doc,
      label: "Business Document",
    })),
  ];

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/vendors"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <BiArrowBack size={18} />
            Back to Vendors
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/vendors/edit?id=${vendor._id}`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <BiPencil size={18} />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <BiTrash size={18} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Profile card: cover + logo + identity */}
      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="h-32 w-full bg-gray-100 sm:h-40">
          {vendor.coverImage?.url && (
            <Image
              src={vendor.coverImage.url}
              alt={`${vendor.name} cover`}
              width={1200}
              height={320}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="p-6">
          <div className="-mt-16 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-gray-50 text-gray-300 shadow-sm">
                {vendor.logo?.url ? (
                  <Image
                    src={vendor.logo.url}
                    alt={vendor.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BiStore size={32} />
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {vendor.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {vendor.contactPerson || "No contact person set"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[vendor.status]}`}
              >
                {STATUS_LABEL[vendor.status]}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-dark">
                {LEVEL_LABEL[vendor.level]}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {vendor.ownership === "third_party"
                  ? "Third-Party"
                  : "Own Vendor"}
              </span>
            </div>
          </div>

          {vendor.description && (
            <p className="mt-5 max-w-3xl text-sm text-gray-600">
              {vendor.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: contact + categories + documents */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Contact Information
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <BiEnvelope size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {vendor.email || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <BiPhone size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {vendor.phone || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <BiGlobe size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-500">Address</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {vendor.address || "—"}
                  </dd>
                </div>
              </div>
              {vendor.website && (
                <div className="flex items-start gap-2.5">
                  <BiGlobe size={18} className="mt-0.5 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500">Website</dt>
                    <dd className="text-sm font-medium text-primary-dark hover:underline">
                      <a href={vendor.website} target="_blank" rel="noreferrer">
                        {vendor.website}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
              {vendor.socialLink && (
                <div className="flex items-start gap-2.5">
                  <BiGlobe size={18} className="mt-0.5 text-gray-400" />
                  <div>
                    <dt className="text-xs text-gray-500">Social Media</dt>
                    <dd className="text-sm font-medium text-primary-dark hover:underline">
                      <a
                        href={vendor.socialLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {vendor.socialLink}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {vendor.categories.length > 0 && (
            <div className="rounded border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Product Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {vendor.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Documents
            </h3>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.key}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400">
                      <BiFile size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.label} · {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: commission + meta */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded border border-gray-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <BiMoney size={16} className="text-gray-400" />
              Commission
            </h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {vendor.commissionRate ?? 0}%
              </p>
              <p className="text-xs text-gray-500">Flat commission rate</p>
            </div>
            {vendor.categoryCommissions.length > 0 && (
              <div className="mt-4 space-y-2">
                {vendor.categoryCommissions.map((cc) => (
                  <div
                    key={cc.category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">{cc.category}</span>
                    <span className="font-medium text-gray-900">
                      {cc.rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {vendor.commissionNotes && (
              <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                {vendor.commissionNotes}
              </p>
            )}
          </div>

          <div className="rounded border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Details
            </h3>
            <dl className="divide-y divide-gray-100">
              {[
                { label: "Slug", value: vendor.slug },
                { label: "Created", value: formatDate(vendor.createdAt) },
                { label: "Last Updated", value: formatDate(vendor.updatedAt) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <dt className="text-gray-500">{row.label}</dt>
                  <dd className="font-medium text-gray-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
