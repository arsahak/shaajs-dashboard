"use client";

import type { BestFor } from "@/app/actions/bestFor";
import {
  BEST_FOR_COLOR_PAIRS,
  bestForGradient,
  sameBestForColors,
  type BestForColors,
} from "@/lib/bestForColors";
import { DESCRIPTION_ICONS } from "@/lib/descriptionIcons";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BiCheck, BiImageAdd, BiSearch, BiTrash } from "react-icons/bi";
import BestForIcon, { DEFAULT_BEST_FOR_ICON } from "./BestForIcon";

export type BestForFormValues = {
  name: string;
  /** The group the option goes in; "" when the entry is itself a group. */
  parent: string;
  /** The icon the card shows when it has no picture — an icon name. */
  icon: string;
  /** The card's background gradient, start then end. */
  colors: BestForColors;
  isActive: boolean;
  sortOrder: string;
};

export const EMPTY_BEST_FOR_FORM: BestForFormValues = {
  name: "",
  parent: "",
  icon: DEFAULT_BEST_FOR_ICON,
  colors: BEST_FOR_COLOR_PAIRS[0],
  isActive: true,
  sortOrder: "0",
};

interface BestForFormProps {
  initialValues?: BestForFormValues;
  /** The entry's current picture when editing; "" for none. */
  initialImage?: string;
  /** The groups an option can be put in. */
  groups: BestFor[];
  /**
   * Set when editing a group that already has options: such a group can't be
   * turned into an option, so its Group choice is fixed.
   */
  lockParent?: boolean;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
}

// The picture has to be a PNG: it is shown with space around it on the
// card's background color, which only looks right with a see-through
// background.
const IMAGE_TYPE = "image/png";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-500";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";

const BestForForm = ({
  initialValues = EMPTY_BEST_FOR_FORM,
  initialImage = "",
  groups,
  lockParent = false,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: BestForFormProps) => {
  const [form, setForm] = useState<BestForFormValues>(initialValues);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconSearch, setIconSearch] = useState("");
  const isGroup = form.parent === "";

  const iconChoices = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    return query
      ? DESCRIPTION_ICONS.filter(
          (icon) =>
            icon.label.toLowerCase().includes(query) ||
            icon.name.replace(/-/g, " ").includes(query),
        )
      : DESCRIPTION_ICONS;
  }, [iconSearch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== IMAGE_TYPE) {
      toast.error("The image must be a PNG file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("The image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", form.name.trim());
    formData.set("parent", form.parent);
    formData.set("icon", form.icon);
    formData.set("colors", JSON.stringify(form.colors));
    formData.set("isActive", String(form.isActive));
    formData.set(
      "sortOrder",
      String(Math.max(0, Math.floor(Number(form.sortOrder) || 0))),
    );
    if (imageFile) formData.set("image", imageFile);
    // The picture it had was taken off and nothing put in its place.
    else if (initialImage && !imagePreview) formData.set("removeImage", "true");
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Group</label>
                <select
                  value={form.parent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parent: e.target.value }))
                  }
                  disabled={lockParent}
                  className={inputClass}
                >
                  <option value="">None — this is a new group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {lockParent
                    ? "This group has options in it, so it has to stay a group."
                    : isGroup
                      ? "A group is the kind of thing being described — Skin Type, Concern, For. Products are tagged with the options inside it."
                      : "An option is what a product gets tagged with — Dry, Oily, Men."}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>
                  {isGroup ? "Group name" : "Option name"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={inputClass}
                  placeholder={isGroup ? "e.g. Skin Type" : "e.g. Dry"}
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 bg-white p-5">
            <h3 className="mb-1 text-sm font-semibold text-gray-900">
              Card Look
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              How this entry looks as a card on the storefront: a background
              color with an icon on it and the name at the bottom left. Upload
              a PNG picture and it takes the icon&apos;s place.
            </p>
            <div className="flex flex-col gap-6 sm:flex-row">
              {/* The card as it will look */}
              <div className="shrink-0">
                <p className={`mb-1.5 ${labelClass}`}>Preview</p>
                <div
                  className="relative h-40 w-40 overflow-hidden rounded-lg shadow-sm"
                  style={{ backgroundImage: bestForGradient(form.colors) }}
                >
                  {/* The picture — or, without one, the icon — sits a little
                      above the middle, clear of the name, with the card's
                      color all round it. */}
                  {imagePreview ? (
                    <div className="absolute top-[42%] left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2">
                      <Image
                        src={imagePreview}
                        alt=""
                        fill
                        unoptimized
                        sizes="96px"
                        className="object-contain drop-shadow-md"
                      />
                    </div>
                  ) : (
                    <BestForIcon
                      name={form.icon}
                      strokeWidth={1.25}
                      className="absolute top-[42%] left-1/2 size-[44%] -translate-x-1/2 -translate-y-1/2 text-white/30"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                  <p className="absolute inset-x-0 bottom-0 line-clamp-2 px-2.5 pb-2.5 text-left text-sm font-medium text-white">
                    {form.name.trim() || (isGroup ? "Group name" : "Option name")}
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-5">
                <div className="space-y-1.5">
                  <label className={labelClass}>Image</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
                    >
                      <BiImageAdd size={18} />
                      {imagePreview ? "Change image" : "Upload image"}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        <BiTrash size={16} />
                        Remove
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={IMAGE_TYPE}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Optional. PNG only, max 5MB — a picture with a see-through
                    background looks best. It is shown where the icon is, with
                    the background color around it.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Icon</label>
                  <div className="relative max-w-xs">
                    <BiSearch
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="search"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      // Enter here shouldn't save the form.
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      placeholder="Search icons…"
                      className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {iconChoices.length === 0 ? (
                      <p className="px-1 py-2 text-xs text-gray-500">
                        No icon matches.
                      </p>
                    ) : (
                      iconChoices.map((icon) => {
                        const picked = icon.name === form.icon;
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            title={icon.label}
                            aria-label={icon.label}
                            aria-pressed={picked}
                            onClick={() =>
                              setForm((f) => ({ ...f, icon: icon.name }))
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                              picked
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <BestForIcon name={icon.name} className="size-5" />
                          </button>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Shown on the card whenever it has no picture.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Background Color</label>
                  <div className="flex flex-wrap gap-2">
                    {BEST_FOR_COLOR_PAIRS.map((colors) => {
                      const picked = sameBestForColors(colors, form.colors);
                      return (
                        <button
                          key={colors.join("-")}
                          type="button"
                          aria-pressed={picked}
                          aria-label={`Gradient ${colors[0]} to ${colors[1]}`}
                          onClick={() => setForm((f) => ({ ...f, colors }))}
                          style={{ backgroundImage: bestForGradient(colors) }}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg text-white transition-transform hover:scale-105 ${
                            picked
                              ? "ring-2 ring-black ring-offset-2"
                              : "ring-1 ring-black/5"
                          }`}
                        >
                          {picked && <BiCheck size={20} />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    The storefront&apos;s own gradients. A new entry starts on
                    one picked at random — choose another if you like.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Organization
            </h3>
            <div className="space-y-1.5">
              <label className={labelClass}>Sort Order</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
                className={inputClass}
              />
              <p className="text-xs text-gray-500">
                Lower numbers come first; ties are listed A–Z.
              </p>
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Status</h3>
            <div className="space-y-1.5">
              <label className={labelClass}>Status</label>
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
              <p className="text-xs text-gray-500">
                {isGroup
                  ? "An inactive group, and every option in it, is hidden from the product form and the storefront."
                  : "An inactive option is hidden from the product form and the storefront."}
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

export default BestForForm;
