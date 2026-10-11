"use client";

import {
  Cost,
  CostCategory,
  CostPayer,
  CostPaymentMethod,
  CostSummary,
  createCostAction,
  deleteCostAction,
  listCostsAction,
  updateCostAction,
} from "@/app/actions/cost";
import Pagination from "@/components/shared/Pagination";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import {
  BiChevronDown,
  BiCoinStack,
  BiDownload,
  BiEdit,
  BiFile,
  BiFilterAlt,
  BiImageAdd,
  BiMoneyWithdraw,
  BiPaperclip,
  BiPlus,
  BiSearch,
  BiTrash,
  BiUser,
  BiVideo,
  BiShow,
  BiX,
} from "react-icons/bi";

const PAGE_SIZE = 10;

type AttachmentPreview = {
  url?: string;
  name: string;
  type: "image" | "video";
  size: number;
};

type CostForm = {
  title: string;
  category: CostCategory;
  customCategory?: string;
  reason: string;
  amount: string;
  date: string;
  paymentMethod: CostPaymentMethod;
  paidBy: CostPayer;
  reference: string;
  comment?: string;
  attachment?: AttachmentPreview;
};

const CATEGORY_OPTIONS: CostCategory[] = [
  "Domain & Hosting",
  "Software & Tools",
  "Marketing",
  "Office Expense",
  "Travel & Transport",
  "Utilities",
  "Salary & Contractor",
  "Other",
];

const todayInputValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const emptySummary: CostSummary = {
  total: 0,
  totalAmount: 0,
  monthAmount: 0,
  todayAmount: 0,
  todayCount: 0,
  attachmentCount: 0,
};

const makeEmptyForm = (): CostForm => ({
  title: "",
  category: "Domain & Hosting",
  customCategory: "",
  reason: "",
  amount: "",
  date: todayInputValue(),
  paymentMethod: "Company Card",
  paidBy: "Sahak",
  reference: "",
  comment: "",
});

const inputClass =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const filterInputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-700";

function formatDate(date: string) {
  const dateOnly = date.slice(0, 10);
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number) {
  return `৳${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function CostingView({ canDelete }: { canDelete: boolean }) {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [summary, setSummary] = useState<CostSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCost, setViewingCost] = useState<Cost | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [payerFilter, setPayerFilter] = useState<"All Payers" | CostPayer>(
    "All Payers",
  );
  const [form, setForm] = useState<CostForm>(makeEmptyForm);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [initialAttachmentUrl, setInitialAttachmentUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModalOpen) modalPanelRef.current?.scrollTo({ top: 0 });
  }, [isModalOpen]);

  useEffect(() => {
    let ignore = false;
    void listCostsAction({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      category:
        categoryFilter === "All Categories"
          ? undefined
          : (categoryFilter as CostCategory),
      paidBy: payerFilter === "All Payers" ? undefined : payerFilter,
    }).then((result) => {
      if (ignore) return;
      if (result.ok && result.data) {
        setCosts(result.data.costs);
        setSummary(result.data.summary);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || "Failed to load costs.");
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [page, search, categoryFilter, payerFilter]);

  const refreshCosts = async (targetPage: number) => {
    setLoading(true);
    const result = await listCostsAction({
      page: targetPage,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      category:
        categoryFilter === "All Categories"
          ? undefined
          : (categoryFilter as CostCategory),
      paidBy: payerFilter === "All Payers" ? undefined : payerFilter,
    });
    if (result.ok && result.data) {
      setCosts(result.data.costs);
      setSummary(result.data.summary);
      setTotalPages(result.data.pagination.totalPages);
    } else {
      toast.error(result.error || "Failed to load costs.");
    }
    setLoading(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(makeEmptyForm());
    setAttachmentFile(null);
    setInitialAttachmentUrl("");
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(makeEmptyForm());
    setAttachmentFile(null);
    setInitialAttachmentUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (cost: Cost) => {
    setEditingId(cost._id);
    setForm({
      title: cost.title,
      category: cost.category,
      customCategory: cost.customCategory ?? "",
      reason: cost.reason,
      amount: String(cost.amount),
      date: cost.date,
      paymentMethod: cost.paymentMethod,
      paidBy: cost.paidBy,
      reference: cost.reference ?? "",
      comment: cost.comment,
      attachment: cost.attachment,
    });
    setAttachmentFile(null);
    setInitialAttachmentUrl(cost.attachment?.url ?? "");
    setIsModalOpen(true);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Attachment must be smaller than 10 MB.");
      return;
    }

    setAttachmentFile(file);
    setForm((current) => ({
      ...current,
      attachment: {
        name: file.name,
        type: file.type.startsWith("video/") ? "video" : "image",
        size: file.size,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);

    if (!form.title.trim() || !form.reason.trim() || !amount || amount <= 0) {
      toast.error("Please complete the title, reason, and amount.");
      return;
    }

    if (form.category === "Other" && !form.customCategory?.trim()) {
      toast.error("Please enter the custom category name.");
      return;
    }

    const payload = new FormData();
    payload.set("title", form.title.trim());
    payload.set("category", form.category);
    payload.set(
      "customCategory",
      form.category === "Other" ? form.customCategory?.trim() || "" : "",
    );
    payload.set("reason", form.reason.trim());
    payload.set("amount", String(amount));
    payload.set("expenseDate", form.date);
    payload.set("paymentMethod", form.paymentMethod);
    payload.set("paidBy", form.paidBy);
    payload.set("reference", form.reference.trim());
    payload.set("comment", form.comment?.trim() || "");
    if (attachmentFile) payload.set("attachment", attachmentFile);
    if (editingId && initialAttachmentUrl && !form.attachment) {
      payload.set("removeAttachment", "true");
    }

    setSubmitting(true);
    const wasEditing = editingId !== null;
    const result = editingId
      ? await updateCostAction(editingId, payload)
      : await createCostAction(payload);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(
        result.fieldErrors?.[0] || result.error || "Failed to save cost.",
      );
      return;
    }

    const targetPage = wasEditing ? page : 1;
    closeModal();
    setPage(targetPage);
    await refreshCosts(targetPage);
    toast.success(wasEditing ? "Cost updated successfully." : "Cost added successfully.");
  };

  const deleteCost = async (cost: Cost) => {
    if (!canDelete) return;
    if (!window.confirm(`Delete cost "${cost.title}"? This cannot be undone.`)) {
      return;
    }

    const result = await deleteCostAction(cost._id);
    if (!result.ok) {
      toast.error(result.error || "Failed to delete cost.");
      return;
    }

    const targetPage = costs.length === 1 && page > 1 ? page - 1 : page;
    setPage(targetPage);
    await refreshCosts(targetPage);
    toast.success("Cost deleted successfully.");
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-gray-50">
      <section className="rounded border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Daily Costing
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
              Keep every company expense, payment reference, and supporting file
              organised in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-black/15"
          >
            <BiPlus size={20} /> Add new cost
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <BiCoinStack size={19} />
            </span>
            <h3 className="text-sm font-medium text-gray-700">This month</h3>
          </div>
          <div className="mb-1 text-3xl font-bold tracking-tight text-gray-900">
            {formatAmount(summary.monthAmount)}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
            }).format(new Date())} expenses
          </p>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BiMoneyWithdraw size={19} />
            </span>
            <h3 className="text-sm font-medium text-gray-700">Total cost</h3>
          </div>
          <div className="mb-1 text-3xl font-bold tracking-tight text-gray-900">
            {formatAmount(summary.totalAmount)}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {payerFilter === "All Payers"
              ? "Across all payers"
              : `Paid by ${payerFilter}`}
          </p>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <BiMoneyWithdraw size={19} />
            </span>
            <h3 className="text-sm font-medium text-gray-700">Total entries</h3>
          </div>
          <p className="mb-1 text-3xl font-bold tracking-tight text-gray-900">{summary.total}</p>
          <p className="mt-1.5 text-xs text-gray-400">{CATEGORY_OPTIONS.length} expense categories</p>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <BiPaperclip size={19} />
            </span>
            <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
          </div>
          <p className="mb-1 text-3xl font-bold tracking-tight text-gray-900">
            {summary.attachmentCount}/{summary.total}
          </p>
          <p className="mt-1.5 text-xs text-gray-400">Receipt or reference files added</p>
        </div>
      </section>

      <section className="rounded border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-[230px] flex-1">
              <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search cost or reference..."
                className={`${filterInputClass} pl-9`}
              />
            </div>
            <div className="relative">
              <BiFilterAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className={`${filterInputClass} min-w-[170px] appearance-none pl-9 pr-9`}
              >
                <option>All Categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <BiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <BiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                aria-label="Cost by"
                value={payerFilter}
                onChange={(event) => {
                  setPayerFilter(event.target.value as "All Payers" | CostPayer);
                  setPage(1);
                }}
                className={`${filterInputClass} min-w-[155px] appearance-none pl-9 pr-9`}
              >
                <option>All Payers</option>
                <option>Sahak</option>
                <option>Ruyel</option>
              </select>
              <BiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              type="button"
              onClick={() => toast.success("Export is ready for backend integration.")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-black/15"
            >
              <BiDownload size={17} /> Export
            </button>
          </div>
      </section>

      <section className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3.5">Cost details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Paid by</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costs.map((cost) => (
                <tr key={cost._id} className="group transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <BiMoneyWithdraw size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[260px] truncate text-sm font-semibold text-gray-900">{cost.title}</p>
                        <p className="mt-0.5 max-w-[320px] truncate text-xs text-gray-400">{cost.reason}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-400">Ref: {cost.reference || "Not added"}</span>
                          {cost.attachment && (
                            <a href={cost.attachment.url} target="_blank" rel="noreferrer" title={`Attachment: ${cost.attachment.name}`} className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-primary hover:bg-blue-100">
                              <BiPaperclip />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {cost.category === "Other" && cost.customCategory
                        ? cost.customCategory
                        : cost.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{formatDate(cost.date)}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-800">{cost.paidBy}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{cost.paymentMethod}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-gray-900">{formatAmount(cost.amount)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingCost(cost)}
                        title="View details"
                        aria-label={`View details for ${cost.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                      >
                        <BiShow size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(cost)}
                        title="Edit cost"
                        aria-label={`Edit ${cost.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                      >
                        <BiEdit size={16} />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteCost(cost)}
                          title="Remove cost"
                          aria-label={`Delete ${cost.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <BiTrash size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {costs.map((cost) => (
            <article key={cost._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cost.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{cost.reason}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setViewingCost(cost)} aria-label={`View details for ${cost.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                    <BiShow size={17} />
                  </button>
                  <button type="button" onClick={() => openEditModal(cost)} aria-label={`Edit ${cost.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                    <BiEdit size={16} />
                  </button>
                  {canDelete && (
                    <button type="button" onClick={() => deleteCost(cost)} aria-label={`Delete ${cost.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600">
                      <BiTrash size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="space-y-1 text-xs text-gray-500">
                  <p>
                    {cost.category === "Other" && cost.customCategory
                      ? cost.customCategory
                      : cost.category}
                  </p>
                  <p>{formatDate(cost.date)} · Paid by {cost.paidBy}</p>
                </div>
                <p className="text-base font-bold text-gray-900">{formatAmount(cost.amount)}</p>
              </div>
            </article>
          ))}
        </div>

        {!loading && costs.length === 0 && (
          <div className="px-6 py-20 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <BiSearch size={26} />
            </span>
            <h3 className="mt-4 font-semibold text-gray-800">No costs found</h3>
            <p className="mt-1 text-sm text-gray-400">Try changing your search or filters.</p>
          </div>
        )}

        {!loading && costs.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      {viewingCost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cost-details-title"
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div className="min-w-0 pr-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Cost details
                </p>
                <h2 id="cost-details-title" className="truncate text-xl font-bold text-gray-900">
                  {viewingCost.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingCost(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close details"
              >
                <BiX size={22} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex flex-col gap-4 rounded border border-gray-200 bg-gray-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">Total amount</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                    {formatAmount(viewingCost.amount)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                  {viewingCost.category === "Other" && viewingCost.customCategory
                    ? viewingCost.customCategory
                    : viewingCost.category}
                </span>
              </div>

              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-400">Expense date</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800">{formatDate(viewingCost.date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-400">Paid by</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800">{viewingCost.paidBy}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-400">Payment method</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800">{viewingCost.paymentMethod}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-400">Reference / transaction ID</dt>
                  <dd className="mt-1 break-words text-sm font-semibold text-gray-800">{viewingCost.reference || "Not added"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-400">Reason / purpose</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{viewingCost.reason}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-400">Comment</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{viewingCost.comment || "No comment added"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-400">Created</dt>
                  <dd className="mt-1 text-sm text-gray-700">{formatDateTime(viewingCost.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-400">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-700">{formatDateTime(viewingCost.updatedAt)}</dd>
                </div>
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-400">Receipt / reference attachment</p>
                {viewingCost.attachment ? (
                  <a
                    href={viewingCost.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded border border-gray-200 bg-gray-50 transition hover:border-gray-300"
                  >
                    {viewingCost.attachment.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={viewingCost.attachment.url}
                        alt={viewingCost.attachment.name}
                        className="max-h-72 w-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                          <BiVideo size={20} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-gray-800">{viewingCost.attachment.name}</span>
                          <span className="mt-0.5 block text-xs text-gray-400">Open video · {formatFileSize(viewingCost.attachment.size)}</span>
                        </span>
                      </div>
                    )}
                    {viewingCost.attachment.type === "image" && (
                      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                        <span className="truncate text-sm font-semibold text-gray-700">{viewingCost.attachment.name}</span>
                        <span className="ml-4 shrink-0 text-xs text-gray-400">{formatFileSize(viewingCost.attachment.size)}</span>
                      </div>
                    )}
                  </a>
                ) : (
                  <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                    No attachment added
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setViewingCost(null)}
                className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const cost = viewingCost;
                  setViewingCost(null);
                  openEditModal(cost);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:ring-4 focus:ring-black/15"
              >
                <BiEdit size={17} /> Edit cost
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="cost-modal-title">
          <div ref={modalPanelRef} className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 id="cost-modal-title" className="text-lg font-bold text-gray-900">
                  {editingId === null ? "Add a new cost" : "Edit cost"}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  {editingId === null
                    ? "Record who paid, why it was paid, and any supporting reference."
                    : "Update this expense's amount, payer, reference, or other details."}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Close modal">
                <BiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="cost-title" className={labelClass}>Cost title <span className="text-red-500">*</span></label>
                  <input id="cost-title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Company domain renewal" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="cost-category" className={labelClass}>Category</label>
                  <select id="cost-category" value={form.category} onChange={(event) => setForm((current) => ({
                    ...current,
                    category: event.target.value as CostCategory,
                    customCategory:
                      event.target.value === "Other"
                        ? current.customCategory
                        : "",
                  }))} className={inputClass}>
                    {CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}
                  </select>
                  {form.category === "Other" && (
                    <input
                      aria-label="Custom category"
                      required
                      value={form.customCategory ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customCategory: event.target.value,
                        }))
                      }
                      placeholder="Enter category name"
                      className={`${inputClass} mt-2`}
                    />
                  )}
                </div>
                <div>
                  <label htmlFor="cost-date" className={labelClass}>Expense date</label>
                  <input id="cost-date" type="date" required value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="cost-amount" className={labelClass}>Amount <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <span className="flex h-11 items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-base font-bold text-gray-700">৳</span>
                    <input id="cost-amount" type="number" min="1" step="1" required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0" className={`${inputClass} rounded-l-none`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="paid-by" className={labelClass}>Paid by</label>
                  <select id="paid-by" value={form.paidBy} onChange={(event) => setForm((current) => ({ ...current, paidBy: event.target.value as "Sahak" | "Ruyel" }))} className={inputClass}>
                    <option>Sahak</option>
                    <option>Ruyel</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="payment-method" className={labelClass}>Payment method</label>
                  <select id="payment-method" value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value as CostPaymentMethod }))} className={inputClass}>
                    <option>Company Card</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Mobile Banking</option>
                    <option>Cash</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cost-reference" className={labelClass}>Reference / transaction ID</label>
                  <input id="cost-reference" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Invoice or transaction number" className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cost-reason" className={labelClass}>Reason / purpose <span className="text-red-500">*</span></label>
                  <textarea id="cost-reason" required rows={3} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Explain why this expense was necessary..." className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10" />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cost-comment" className={labelClass}>Comment</label>
                  <input id="cost-comment" value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Optional internal note" className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Receipt / reference attachment</label>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={handleFile} className="hidden" />
                  {form.attachment ? (
                    <div className="flex items-center gap-3 rounded border border-blue-100 bg-blue-50/60 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                        {form.attachment.type === "video" ? <BiVideo size={20} /> : <BiFile size={20} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">{form.attachment.name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatFileSize(form.attachment.size)}</p>
                      </div>
                      <button type="button" onClick={() => {
                        setAttachmentFile(null);
                        setForm((current) => ({ ...current, attachment: undefined }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-red-500" aria-label="Remove attachment">
                        <BiTrash size={16} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50/60 px-6 py-7 text-center transition hover:border-primary/50 hover:bg-blue-50/40">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm"><BiImageAdd size={20} /></span>
                      <span className="mt-3 text-sm font-semibold text-gray-700">Upload receipt or reference</span>
                      <span className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP, GIF or MP4 · Maximum 10 MB</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="h-11 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-800 focus:ring-4 focus:ring-black/15 disabled:cursor-not-allowed disabled:opacity-60">
                  {!submitting && (editingId === null ? <BiPlus size={19} /> : <BiEdit size={18} />)}
                  {submitting
                    ? "Saving..."
                    : editingId === null
                      ? "Save cost"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
