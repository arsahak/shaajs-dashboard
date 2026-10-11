"use client";

import { FormStep } from "@/components/product/FormStep";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { toast } from "react-hot-toast";
import {
  BiChevronDown,
  BiImageAdd,
  BiPalette,
  BiPlus,
  BiPurchaseTag,
  BiRuler,
  BiTrash,
  BiX,
} from "react-icons/bi";

/** A photo picked in the form but not uploaded yet. */
export interface PendingColorImage {
  file: File;
  /** Object URL for the thumbnail. */
  preview: string;
}

export interface ProductColorValue {
  /** Display name shoppers see, e.g. "Navy Blue". */
  name: string;
  /** Swatch color as #rrggbb. */
  hex: string;
  /** Sizes this color comes in — empty means it has no sizes. */
  sizes: string[];
  /**
   * The already-uploaded photo of this color, when editing. A color has one
   * photo at most; these stay arrays to match the API.
   */
  images: string[];
  /** The photo picked in this session, uploaded on save. */
  newImages: PendingColorImage[];
}

/** How one size's price differs from the product's base price. */
export interface SizePriceDraft {
  direction: "more" | "less";
  /** Amount as typed — a positive number once valid. */
  amount: string;
}

export interface ProductOptionsValue {
  /**
   * Without colors: the product's own size list. With colors: every size any
   * color uses (kept in sync here — sizes are edited per color).
   */
  sizes: string[];
  colors: ProductColorValue[];
  /**
   * Sizes priced differently from the base price, keyed by the size in
   * lowercase. A size with no entry costs the base price.
   */
  sizePrices: Record<string, SizePriceDraft>;
}

export const EMPTY_PRODUCT_OPTIONS: ProductOptionsValue = {
  sizes: [],
  colors: [],
  sizePrices: {},
};

/** The form's base prices (as typed), which size prices are relative to. */
export interface ProductBasePricing {
  price: string;
  discountPrice: string;
}

const sizeKey = (size: string) => size.toLowerCase();

// A size's price entry, or undefined when it costs the base price. (A
// function, because indexing the record directly is typed as always present.)
const sizePriceFor = (
  sizePrices: Record<string, SizePriceDraft>,
  size: string,
): SizePriceDraft | undefined => sizePrices[sizeKey(size)];

// A typed amount as a positive number, or null while empty/invalid.
const parseAmount = (amount: string): number | null => {
  const value = Number(amount);
  return amount.trim() !== "" && Number.isFinite(value) && value > 0
    ? value
    : null;
};

const formatTaka = (amount: number) =>
  `৳${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// Mirrors the backend limits in utils/productOptions.ts.
const MAX_SIZES = 30;
const MAX_COLORS = 30;
const MAX_SIZE_LENGTH = 20;
const MAX_COLOR_NAME_LENGTH = 40;
const MAX_COLOR_IMAGE_BYTES = 5 * 1024 * 1024;
const COLOR_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// One-tap starting points — sizes are free text, these just save typing.
const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Clothing", sizes: ["S", "M", "L", "XL", "2XL"] },
  { label: "Waist", sizes: ["28", "30", "32", "34", "36"] },
  { label: "Shoes", sizes: ["39", "40", "41", "42", "43", "44"] },
];

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#ffffff" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#f97316" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Green", hex: "#16a34a" },
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Brown", hex: "#92400e" },
  { name: "Beige", hex: "#e7d8c1" },
];

const HEX_REGEX = /^#[0-9a-f]{6}$/i;

const sameSize = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// Adds sizes that aren't in `current` yet (ignoring case), cleaned up.
const mergeSizes = (current: string[], incoming: string[]): string[] => {
  const merged = [...current];
  for (const raw of incoming) {
    const size = raw.trim().replace(/\s+/g, " ").slice(0, MAX_SIZE_LENGTH);
    if (!size || merged.some((existing) => sameSize(existing, size))) continue;
    if (merged.length >= MAX_SIZES) break;
    merged.push(size);
  }
  return merged;
};

// Every size used by any color, in first-seen order.
const sizesAcrossColors = (colors: ProductColorValue[]): string[] =>
  colors.reduce<string[]>((all, color) => mergeSizes(all, color.sizes), []);

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const subLabelClass =
  "block text-xs font-semibold uppercase tracking-wider text-gray-500";

/** Returns a message when the options can't be saved yet, otherwise null. */
export const validateProductOptions = (
  value: ProductOptionsValue,
  pricing?: ProductBasePricing,
): string | null => {
  const names = new Set<string>();
  for (const [index, color] of value.colors.entries()) {
    const name = color.name.trim();
    if (!name) return `Please give color #${index + 1} a name.`;
    if (!HEX_REGEX.test(color.hex)) {
      return `Color "${name}" needs a valid color value like #1a2b3c.`;
    }
    if (names.has(name.toLowerCase())) {
      return `Color "${name}" is listed more than once.`;
    }
    names.add(name.toLowerCase());
  }

  // The cheapest base price a size discount is taken off.
  const basePrices = [pricing?.price, pricing?.discountPrice]
    .map((price) => (price ? Number(price) : NaN))
    .filter((price) => Number.isFinite(price));
  const lowestBase = basePrices.length > 0 ? Math.min(...basePrices) : null;

  for (const size of value.sizes) {
    const draft = sizePriceFor(value.sizePrices, size);
    if (!draft) continue;
    const amount = parseAmount(draft.amount);
    if (amount === null) {
      return `Enter how much ${draft.direction} size ${size} costs, or set it back to Same.`;
    }
    if (draft.direction === "less" && lowestBase !== null && amount > lowestBase) {
      return `Size ${size} can't be ${formatTaka(amount)} cheaper — that's below zero.`;
    }
  }
  return null;
};

/**
 * Adds the options to the product request the way the API expects them:
 * `sizes` and `colors` as JSON, and every new color photo in `colorImages`
 * with a parallel `colorImageIndexes` saying which color each file is for.
 * Always sent (even empty) so clearing everything on edit really clears it.
 */
export const appendProductOptions = (
  formData: FormData,
  value: ProductOptionsValue,
) => {
  formData.set("sizes", JSON.stringify(value.sizes));
  formData.set(
    "colors",
    JSON.stringify(
      value.colors.map((color) => ({
        name: color.name.trim(),
        hex: color.hex.toLowerCase(),
        sizes: color.sizes,
        images: color.images,
      })),
    ),
  );

  const indexes: number[] = [];
  value.colors.forEach((color, index) => {
    for (const image of color.newImages) {
      formData.append("colorImages", image.file);
      indexes.push(index);
    }
  });
  formData.set("colorImageIndexes", JSON.stringify(indexes));

  // Only sizes the product still has, and only real differences.
  formData.set(
    "sizePrices",
    JSON.stringify(
      value.sizes.flatMap((size) => {
        const draft = sizePriceFor(value.sizePrices, size);
        const amount = draft ? parseAmount(draft.amount) : null;
        return draft && amount !== null
          ? [{ size, adjustment: draft.direction === "less" ? -amount : amount }]
          : [];
      }),
    ),
  );
};

// ── Size chips ────────────────────────────────────────────────────────────

interface SizeChipsProps {
  inputId: string;
  sizes: string[];
  onChange: (sizes: string[]) => void;
  /** Sizes used elsewhere on this product, offered as one-tap additions. */
  suggestions?: string[];
}

/** Free-text size list: chips, an input, and quick ways to fill it. */
const SizeChips = ({ inputId, sizes, onChange, suggestions = [] }: SizeChipsProps) => {
  const [draft, setDraft] = useState("");

  const add = (incoming: string[]) => {
    const merged = mergeSizes(sizes, incoming);
    if (merged.length !== sizes.length) onChange(merged);
  };

  const commitDraft = () => {
    // Several at once: "S, M, L".
    add(draft.split(","));
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      // Enter must not submit the whole product form.
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && !draft && sizes.length > 0) {
      onChange(sizes.slice(0, -1));
    }
  };

  const unusedSuggestions = suggestions.filter(
    (size) => !sizes.some((own) => sameSize(own, size)),
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        {sizes.length === 0 && !draft && (
          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
            None
          </span>
        )}
        {sizes.map((size) => (
          <span
            key={size}
            className="inline-flex items-center gap-1 rounded-md bg-gray-900 py-1 pr-1 pl-2.5 text-xs font-semibold text-white"
          >
            {size}
            <button
              type="button"
              aria-label={`Remove size ${size}`}
              onClick={() =>
                onChange(sizes.filter((existing) => !sameSize(existing, size)))
              }
              className="flex h-4 w-4 items-center justify-center rounded text-white/70 hover:bg-white/20 hover:text-white"
            >
              <BiX className="text-sm" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          maxLength={120}
          placeholder={
            sizes.length === 0
              ? "Type a size and press Enter — M, 32, Free Size…"
              : "Add another…"
          }
          className="min-w-[9rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {unusedSuggestions.length > 0 && (
          <>
            <span className="text-xs text-gray-500">Used on this product:</span>
            {unusedSuggestions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => add([size])}
                className="rounded-md border border-dashed border-gray-300 px-2 py-0.5 text-xs font-semibold text-gray-600 transition-colors hover:border-primary hover:text-primary"
              >
                + {size}
              </button>
            ))}
            <button
              type="button"
              onClick={() => add(unusedSuggestions)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Add all
            </button>
            <span aria-hidden="true" className="mx-1 h-3 w-px bg-gray-200" />
          </>
        )}
        <span className="text-xs text-gray-500">Quick add:</span>
        {SIZE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => add(preset.sizes)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 transition-colors hover:border-primary hover:text-primary"
          >
            <BiPlus className="text-sm" />
            <span className="font-medium">{preset.label}</span>
            <span className="text-gray-400">
              {preset.sizes[0]}–{preset.sizes[preset.sizes.length - 1]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Editor ────────────────────────────────────────────────────────────────

interface ProductOptionsEditorProps {
  value: ProductOptionsValue;
  onChange: (value: ProductOptionsValue) => void;
  /** The form's regular / discount price, for the per-size price preview. */
  pricing: ProductBasePricing;
  /**
   * The product's weight/volume fields, shown at the top of the Size step
   * (they live in the form's own state, so the form renders them).
   */
  weightField?: ReactNode;
}

/**
 * The "Color", "Size" and "Price by Size" steps of the product form
 * (rendered inside a `FormSteps` list).
 *
 * Color is "None" by default, and the product then just has an optional size
 * list. Switching to colors turns it into a list where each color is the
 * parent of its own photos and its own sizes.
 */
const ProductOptionsEditor = ({
  value,
  onChange,
  pricing,
  weightField,
}: ProductOptionsEditorProps) => {
  const { sizes, colors, sizePrices } = value;
  // "Same price" until any size is given its own price.
  const [pricesVary, setPricesVary] = useState(
    Object.keys(sizePrices).length > 0,
  );
  const [hasColors, setHasColors] = useState(colors.length > 0);
  // Every size entered so far in this form — offered as one-tap suggestions
  // under each color, so the same sizes needn't be typed again per color.
  const [sizePool, setSizePool] = useState<string[]>(sizes);
  // Index of the color whose picker popover is open.
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close the color picker on an outside click or Escape.
  useEffect(() => {
    if (pickerOpen === null) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(null);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  // With colors, the product's size list is whatever the colors use.
  const setColors = (next: ProductColorValue[]) => {
    const used = sizesAcrossColors(next);
    setSizePool((pool) => mergeSizes(pool, used));
    onChange({ ...value, sizes: used, colors: next });
  };

  const updateColor = (index: number, patch: Partial<ProductColorValue>) => {
    setColors(
      colors.map((color, i) => (i === index ? { ...color, ...patch } : color)),
    );
  };

  const blankColor = (preset?: {
    name: string;
    hex: string;
  }): ProductColorValue => ({
    name: preset?.name ?? "",
    hex: preset?.hex ?? "#2563eb",
    // Size is "None" until sizes are added to this color.
    sizes: [],
    images: [],
    newImages: [],
  });

  const addColor = (preset?: { name: string; hex: string }) => {
    if (colors.length >= MAX_COLORS) return;
    setColors([...colors, blankColor(preset)]);
    // A custom color opens straight into the picker.
    if (!preset) setPickerOpen(colors.length);
  };

  const removeColor = (index: number) => {
    colors[index].newImages.forEach((image) =>
      URL.revokeObjectURL(image.preview),
    );
    setPickerOpen(null);
    const remaining = colors.filter((_, i) => i !== index);
    setColors(remaining);
    // Removing the last color is the same as choosing "None".
    if (remaining.length === 0) setHasColors(false);
  };

  // ── None ⇄ Colors ───────────────────────────────────────────────────────

  const chooseColors = () => {
    if (hasColors) return;
    setHasColors(true);
    // The product's own sizes become suggestions for its colors.
    setSizePool((pool) => mergeSizes(pool, sizes));
    // Start with one color to fill in.
    if (colors.length === 0) {
      onChange({ ...value, colors: [blankColor()] });
      setPickerOpen(0);
    }
  };

  const chooseNone = () => {
    if (!hasColors) return;
    const hasWork = colors.some(
      (color) =>
        color.name.trim() ||
        color.sizes.length > 0 ||
        color.images.length > 0 ||
        color.newImages.length > 0,
    );
    if (
      hasWork &&
      !window.confirm(
        "Switch to no colors? The colors below, with their photos, will be removed. Their sizes are kept as the product's sizes.",
      )
    ) {
      return;
    }
    colors.forEach((color) =>
      color.newImages.forEach((image) => URL.revokeObjectURL(image.preview)),
    );
    setPickerOpen(null);
    setHasColors(false);
    onChange({ ...value, colors: [] });
  };

  // ── Price by size ───────────────────────────────────────────────────────

  const basePrice = pricing.price ? Number(pricing.price) : NaN;
  const baseDiscount = pricing.discountPrice
    ? Number(pricing.discountPrice)
    : NaN;
  const hasBasePrice = Number.isFinite(basePrice);
  const hasDiscount = Number.isFinite(baseDiscount);

  const setSizePrice = (size: string, draft: SizePriceDraft | null) => {
    const next = { ...sizePrices };
    if (draft) next[sizeKey(size)] = draft;
    else delete next[sizeKey(size)];
    onChange({ ...value, sizePrices: next });
  };

  const choosePricesVary = (vary: boolean) => {
    setPricesVary(vary);
    // Back to one price for every size.
    if (!vary && Object.keys(sizePrices).length > 0) {
      onChange({ ...value, sizePrices: {} });
    }
  };

  // ── Color photos ────────────────────────────────────────────────────────

  // A color has a single photo, so picking one replaces whatever was there.
  const setColorImage = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Let the same file be picked again later.
    event.target.value = "";
    if (!file) return;

    if (!COLOR_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_COLOR_IMAGE_BYTES) {
      toast.error("The image must be 5MB or smaller.");
      return;
    }

    colors[index].newImages.forEach((image) =>
      URL.revokeObjectURL(image.preview),
    );
    updateColor(index, {
      images: [],
      newImages: [{ file, preview: URL.createObjectURL(file) }],
    });
  };

  const removeColorImage = (index: number) => {
    colors[index].newImages.forEach((image) =>
      URL.revokeObjectURL(image.preview),
    );
    updateColor(index, { images: [], newImages: [] });
  };

  const usedColorNames = new Set(
    colors.map((color) => color.name.trim().toLowerCase()),
  );
  const availablePresets = COLOR_PRESETS.filter(
    (preset) => !usedColorNames.has(preset.name.toLowerCase()),
  );

  // A child row hanging off its color: the short connector meets the
  // vertical line drawn by the children wrapper.
  const branchClass =
    "relative before:absolute before:top-2.5 before:-left-5 before:h-px before:w-4 before:bg-gray-300";
  const branchLabelClass =
    "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500";

  return (
    <>
      <FormStep
        icon={<BiPalette />}
        title="Color"
        hint={
          hasColors
            ? "Each color has its own photo and its own sizes."
            : "Choose “Has colors” if this product comes in more than one color."
        }
        aside={
          <div
            role="radiogroup"
            aria-label="Color option"
            className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!hasColors}
              onClick={chooseNone}
              className={`rounded-md px-3 py-1 transition-colors ${
                !hasColors
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              None
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={hasColors}
              onClick={chooseColors}
              className={`rounded-md px-3 py-1 transition-colors ${
                hasColors
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Has colors
            </button>
          </div>
        }
      >
        {!hasColors ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500">
            No colors — this product is sold as a single color.
          </p>
        ) : (
          <div className="space-y-4">
            {colors.map((color, index) => {
              const hexValid = HEX_REGEX.test(color.hex);
              // Newly picked photo first, else the saved one.
              const photo = color.newImages[0]?.preview ?? color.images[0];
              const label = color.name.trim() || `color ${index + 1}`;
              return (
                <div
                  key={index}
                  data-color-row
                  className="rounded-lg border border-gray-200 bg-gray-50/60 p-3"
                >
                  {/* Parent: the color itself */}
                  <div className="flex items-center gap-2.5">
                    <div
                      ref={pickerOpen === index ? pickerRef : undefined}
                      className="relative shrink-0"
                    >
                      <button
                        type="button"
                        aria-label={`Pick color for ${label}`}
                        aria-expanded={pickerOpen === index}
                        onClick={() =>
                          setPickerOpen(pickerOpen === index ? null : index)
                        }
                        className={`flex h-10 items-center gap-2 rounded-lg border bg-white py-1 pr-2 pl-1.5 transition-colors ${
                          pickerOpen === index
                            ? "border-primary ring-4 ring-primary/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className="h-7 w-7 shrink-0 rounded-md border border-black/10"
                          style={{
                            backgroundColor: hexValid ? color.hex : "#ffffff",
                          }}
                        />
                        <span className="hidden font-mono text-xs text-gray-600 uppercase sm:inline">
                          {color.hex}
                        </span>
                        <BiChevronDown
                          className={`text-base text-gray-400 transition-transform ${
                            pickerOpen === index ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {pickerOpen === index && (
                        <div className="absolute top-full left-0 z-20 mt-2 w-[232px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                          <HexColorPicker
                            color={hexValid ? color.hex : "#ffffff"}
                            onChange={(hex) => updateColor(index, { hex })}
                            style={{ width: "100%", height: 160 }}
                          />
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className="h-8 w-8 shrink-0 rounded-md border border-black/10"
                              style={{
                                backgroundColor: hexValid
                                  ? color.hex
                                  : "#ffffff",
                              }}
                            />
                            <HexColorInput
                              color={color.hex}
                              onChange={(hex) => updateColor(index, { hex })}
                              prefixed
                              aria-label="Hex color value"
                              spellCheck={false}
                              className={`${inputClass} py-1.5 font-mono uppercase`}
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {COLOR_PRESETS.map((preset) => (
                              <button
                                key={preset.hex}
                                type="button"
                                title={preset.name}
                                aria-label={`Use ${preset.name}`}
                                onClick={() =>
                                  updateColor(index, { hex: preset.hex })
                                }
                                className="h-5 w-5 rounded-full border border-gray-300 transition-transform hover:scale-110"
                                style={{ backgroundColor: preset.hex }}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPickerOpen(null)}
                            className="mt-3 w-full rounded-lg bg-gray-900 py-1.5 text-xs font-semibold text-white hover:bg-black"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      value={color.name}
                      onChange={(e) =>
                        updateColor(index, { name: e.target.value })
                      }
                      maxLength={MAX_COLOR_NAME_LENGTH}
                      placeholder="Color name — e.g. Navy Blue"
                      aria-label={`Name of color ${index + 1}`}
                      className={`${inputClass} min-w-0 flex-1 bg-white`}
                    />

                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      onClick={() => removeColor(index)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <BiTrash className="text-lg" />
                    </button>
                  </div>

                  {/* Children: this color's photo, then its sizes */}
                  <div className="mt-3 ml-5 space-y-4 border-l border-gray-300 pl-5">
                    <div className={branchClass}>
                      <div className={branchLabelClass}>
                        <BiImageAdd className="text-sm" />
                        Photo
                      </div>
                      {photo ? (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-white">
                              <Image
                                src={photo}
                                alt={`${label} photo`}
                                width={64}
                                height={64}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove photo of ${label}`}
                              onClick={() => removeColorImage(index)}
                              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-500 shadow ring-1 ring-gray-200 hover:text-red-600"
                            >
                              <BiX className="text-sm" />
                            </button>
                          </div>
                          <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary">
                            Change photo
                            <input
                              type="file"
                              accept={COLOR_IMAGE_TYPES.join(",")}
                              onChange={(e) => setColorImage(index, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label
                          title="Add a photo of this color"
                          className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-gray-400 transition-colors hover:border-primary hover:text-primary"
                        >
                          <BiImageAdd className="text-xl" />
                          <span className="sr-only">
                            Add a photo for {label}
                          </span>
                          <input
                            type="file"
                            accept={COLOR_IMAGE_TYPES.join(",")}
                            onChange={(e) => setColorImage(index, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className={branchClass}>
                      <label
                        htmlFor={`color-${index}-sizes`}
                        className={branchLabelClass}
                      >
                        <BiRuler className="text-sm" />
                        Sizes
                      </label>
                      <SizeChips
                        inputId={`color-${index}-sizes`}
                        sizes={color.sizes}
                        onChange={(next) => updateColor(index, { sizes: next })}
                        suggestions={sizePool}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
              <button
                type="button"
                onClick={() => addColor()}
                disabled={colors.length >= MAX_COLORS}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BiPlus className="text-base" />
                {colors.length === 0 ? "Add a color" : "Add another color"}
              </button>

              {availablePresets.length > 0 && colors.length < MAX_COLORS && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-0.5 text-xs text-gray-500">or pick:</span>
                  {availablePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      title={`Add ${preset.name}`}
                      aria-label={`Add ${preset.name}`}
                      onClick={() => addColor(preset)}
                      className="h-6 w-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </FormStep>

      {/* How big one item is, and — without colors — the sizes it comes in. */}
      <FormStep
        icon={<BiRuler />}
        title="Size"
        hint={
          hasColors
            ? "How much one item weighs or holds. Sizes are set under each color above."
            : "How much one item weighs or holds, and the sizes it comes in."
        }
      >
        <div className="space-y-4">
          {weightField}

          {!hasColors && (
            <div className="space-y-1.5">
              <label htmlFor="product-sizes" className={subLabelClass}>
                Sizes
              </label>
              <SizeChips
                inputId="product-sizes"
                sizes={sizes}
                onChange={(next) => {
                  setSizePool((pool) => mergeSizes(pool, next));
                  onChange({ ...value, sizes: next, colors: [] });
                }}
              />
              <p className="text-xs text-gray-500">
                Leave it as None if this product has no sizes. Sizes are free
                text — letters, numbers, anything your product uses.
              </p>
            </div>
          )}
        </div>
      </FormStep>

      {/* Only meaningful once there are sizes to price. */}
      {sizes.length > 0 && (
        <FormStep
          icon={<BiPurchaseTag />}
          title="Price by Size"
          hint={
            pricesVary
              ? "Say how much more or less each size costs than the product's price. The same difference applies to the discount price."
              : "Choose “Varies by size” if some sizes cost more or less."
          }
          aside={
            <div
              role="radiogroup"
              aria-label="Price by size"
              className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold"
            >
              {[
                { label: "Same price", vary: false },
                { label: "Varies by size", vary: true },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={pricesVary === option.vary}
                  onClick={() => choosePricesVary(option.vary)}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    pricesVary === option.vary
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        >
          {!pricesVary ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500">
              Every size costs the same
              {hasBasePrice && (
                <>
                  {" — "}
                  <span className="font-semibold text-gray-700">
                    {formatTaka(hasDiscount ? baseDiscount : basePrice)}
                  </span>
                </>
              )}
              .
            </p>
          ) : (
            <div className="space-y-2">
              {!hasBasePrice && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Enter the regular price under Pricing to see each
                  size&apos;s final price here.
                </p>
              )}
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {sizes.map((size) => {
                  const draft = sizePriceFor(sizePrices, size);
                  const direction = draft?.direction ?? "same";
                  const amount = draft ? parseAmount(draft.amount) : null;
                  const signed =
                    amount === null ? 0 : direction === "less" ? -amount : amount;
                  const finalRegular = basePrice + signed;
                  const finalDiscount = baseDiscount + signed;
                  const belowZero =
                    hasBasePrice &&
                    (hasDiscount ? finalDiscount : finalRegular) < 0;
                  return (
                    <div
                      key={size}
                      data-size-price-row={size}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                    >
                      <span className="min-w-12 rounded-md bg-gray-900 px-2.5 py-1 text-center text-xs font-semibold text-white">
                        {size}
                      </span>

                      <div
                        role="radiogroup"
                        aria-label={`Price of size ${size}`}
                        className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold"
                      >
                        {(
                          [
                            { key: "less", label: "− Less" },
                            { key: "same", label: "Same" },
                            { key: "more", label: "+ More" },
                          ] as const
                        ).map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            role="radio"
                            aria-checked={direction === option.key}
                            onClick={() =>
                              setSizePrice(
                                size,
                                option.key === "same"
                                  ? null
                                  : {
                                      direction: option.key,
                                      amount: draft?.amount ?? "",
                                    },
                              )
                            }
                            className={`rounded-md px-2.5 py-1 transition-colors ${
                              direction !== option.key
                                ? "text-gray-500 hover:text-gray-700"
                                : option.key === "less"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : option.key === "more"
                                    ? "bg-primary text-white shadow-sm"
                                    : "bg-white text-gray-900 shadow-sm"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-28">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400">
                          ৳
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          disabled={direction === "same"}
                          value={draft?.amount ?? ""}
                          onChange={(e) =>
                            draft &&
                            setSizePrice(size, {
                              direction: draft.direction,
                              amount: e.target.value,
                            })
                          }
                          placeholder={direction === "same" ? "—" : "0"}
                          aria-label={`How much ${direction === "less" ? "less" : "more"} size ${size} costs`}
                          className={`${inputClass} pl-7 disabled:bg-gray-50 disabled:text-gray-400`}
                        />
                      </div>

                      {hasBasePrice && (
                        <div className="ml-auto text-right text-sm">
                          {belowZero ? (
                            <span className="font-medium text-red-600">
                              Below zero
                            </span>
                          ) : (
                            <>
                              <span className="font-semibold text-gray-900">
                                {formatTaka(
                                  hasDiscount ? finalDiscount : finalRegular,
                                )}
                              </span>
                              {hasDiscount && (
                                <span className="ml-1.5 text-xs text-gray-400 line-through">
                                  {formatTaka(finalRegular)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </FormStep>
      )}
    </>
  );
};

export default ProductOptionsEditor;
