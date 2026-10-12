"use client";

import { Brand } from "@/app/actions/brand";
import { Category } from "@/app/actions/category";
import { ProductUnit } from "@/app/actions/product";
import { Vendor } from "@/app/actions/vendors";
import { FormStep, FormSteps } from "@/components/product/FormStep";
import ProductOptionsEditor, {
  EMPTY_PRODUCT_OPTIONS,
  appendProductOptions,
  validateProductOptions,
  type ProductOptionsValue,
} from "@/components/product/ProductOptionsEditor";
import RichTextEditor from "@/components/shared/RichTextEditor";
import SearchSelect, {
  SearchSelectOption,
} from "@/components/shared/SearchSelect";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BiCloudUpload,
  BiImageAdd,
  BiImages,
  BiLogoYoutube,
  BiStore,
  BiVideo,
  BiX,
} from "react-icons/bi";

const MAX_GALLERY_IMAGES = 6;
const VIDEO_MIME_TYPES = "video/mp4,video/webm,video/quicktime";

type ProductVideoSource = "" | "upload" | "youtube";

// Same id-extraction the backend uses to validate/canonicalize — used here
// only for an instant thumbnail preview, not as the source of truth.
const extractYoutubeId = (url: string): string | null => {
  const match = url
    .trim()
    .match(
      /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
  return match ? match[1] : null;
};

// Renders categories in parent > child > grandchild order. Each option
// carries its nesting depth (for indentation) and a full breadcrumb path (so
// the lineage stays visible once selected) — any level, not just leaves, is
// selectable.
const buildCategoryOptions = (categories: Category[]): SearchSelectOption[] => {
  const byParent = new Map<string, Category[]>();
  for (const c of categories) {
    const key = c.parent || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const siblings of byParent.values()) {
    siblings.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }

  const options: SearchSelectOption[] = [];
  const walk = (parentKey: string, depth: number, ancestry: string[]) => {
    for (const c of byParent.get(parentKey) || []) {
      const path = [...ancestry, c.name];
      options.push({
        id: c._id,
        label: c.name,
        depth,
        fullPath: path.join(" › "),
      });
      walk(c._id, depth + 1, path);
    }
  };
  walk("root", 0, []);
  return options;
};

export type ProductFormValues = {
  title: string;
  sku: string;
  category: string;
  brand: string;
  shortDescription: string;
  overview: string;
  price: string;
  discountPrice: string;
  unit: ProductUnit;
  weight: string;
  productSource: "own" | "vendor";
  vendor: string;
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isFreeDelivery: boolean;
  isNewArrival: boolean;
};

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  title: "",
  sku: "",
  category: "",
  brand: "",
  shortDescription: "",
  overview: "",
  price: "",
  discountPrice: "",
  unit: "pcs",
  weight: "1",
  productSource: "own",
  vendor: "",
  isFeatured: false,
  isTrending: false,
  isBestSeller: false,
  isFreeDelivery: false,
  isNewArrival: false,
};

const PRODUCT_UNITS: ProductUnit[] = ["kg", "g", "l", "ml", "pcs"];

// What each unit means, for the dropdown next to Weight / Volume.
const UNIT_LABELS: Record<ProductUnit, string> = {
  pcs: "pcs — pieces",
  kg: "kg — kilograms",
  g: "g — grams",
  l: "l — litres",
  ml: "ml — millilitres",
};

interface ProductFormProps {
  categories: Category[];
  brands: Brand[];
  vendors: Vendor[];
  initialValues?: ProductFormValues;
  initialFeatureImage?: string;
  initialGalleryImages?: string[];
  initialVideoUrl?: string;
  initialVideoSource?: ProductVideoSource;
  initialNewArrivalSetAt?: string | null;
  /** Existing sizes + colors when editing; empty for a new product. */
  initialOptions?: ProductOptionsValue;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";

const ProductForm = ({
  categories,
  brands,
  vendors,
  initialValues = EMPTY_PRODUCT_FORM,
  initialFeatureImage = "",
  initialGalleryImages = [],
  initialVideoUrl = "",
  initialVideoSource = "",
  initialNewArrivalSetAt = null,
  initialOptions = EMPTY_PRODUCT_OPTIONS,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: ProductFormProps) => {
  const [form, setForm] = useState<ProductFormValues>(initialValues);
  const [options, setOptions] = useState<ProductOptionsValue>(initialOptions);

  const newArrivalDaysLeft = useMemo(() => {
    if (!form.isNewArrival || !initialNewArrivalSetAt) return null;
    const elapsedMs = Date.now() - new Date(initialNewArrivalSetAt).getTime();
    const daysLeft = 30 - Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  }, [form.isNewArrival, initialNewArrivalSetAt]);

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );

  // A–Z for the brand picker, whatever order the brands are stored in.
  const brandOptions = useMemo<SearchSelectOption[]>(
    () =>
      [...brands]
        .sort((a, b) =>
          a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
        )
        .map((b) => ({ id: b._id, label: b.name })),
    [brands],
  );

  const [featureFile, setFeatureFile] = useState<File | null>(null);
  const [featurePreview, setFeaturePreview] = useState<string>(
    initialFeatureImage,
  );
  const [removeFeatureImage, setRemoveFeatureImage] = useState(false);
  const featureInputRef = useRef<HTMLInputElement>(null);

  // Existing (already-uploaded) gallery images kept for this save, and newly
  // picked local files — kept as separate lists so images can be removed
  // individually instead of the whole gallery being replaced on each pick.
  const [keptGalleryImages, setKeptGalleryImages] = useState<string[]>(
    initialGalleryImages,
  );
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const gallerySlotsUsed = keptGalleryImages.length + galleryFiles.length;
  // The gallery is only for plain products: once the product has colors or
  // sizes, its pictures are the feature image and each color's own photo.
  const showGallery =
    options.colors.length === 0 && options.sizes.length === 0;
  const gallerySlotsLeft = MAX_GALLERY_IMAGES - gallerySlotsUsed;

  const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeatureFile(file);
    setFeaturePreview(URL.createObjectURL(file));
    setRemoveFeatureImage(false);
  };

  const handleRemoveFeatureImage = () => {
    setFeatureFile(null);
    setFeaturePreview("");
    if (featureInputRef.current) featureInputRef.current.value = "";
    if (initialFeatureImage) setRemoveFeatureImage(true);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const accepted = files.slice(0, gallerySlotsLeft);
    if (files.length > accepted.length) {
      toast.error(`You can add up to ${MAX_GALLERY_IMAGES} gallery images.`);
    }
    if (accepted.length === 0) return;

    setGalleryFiles((prev) => [...prev, ...accepted]);
    setGalleryPreviews((prev) => [
      ...prev,
      ...accepted.map((file) => URL.createObjectURL(file)),
    ]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleRemoveKeptGalleryImage = (index: number) => {
    setKeptGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Product video: either a directly-uploaded file or a pasted YouTube
  // link — mutually exclusive, alongside the image gallery above.
  const [videoMode, setVideoMode] = useState<ProductVideoSource>(
    initialVideoSource,
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>(
    initialVideoSource === "upload" ? initialVideoUrl : "",
  );
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(
    initialVideoSource === "youtube" ? initialVideoUrl : "",
  );
  const [removeVideo, setRemoveVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setVideoMode("upload");
    setRemoveVideo(false);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    setYoutubeUrlInput("");
    setVideoMode("");
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (initialVideoUrl) setRemoveVideo(true);
  };

  const youtubePreviewId = extractYoutubeId(youtubeUrlInput);

  const discountPriceInvalid =
    form.discountPrice !== "" &&
    form.price !== "" &&
    Number(form.discountPrice) >= Number(form.price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category) {
      toast.error("Please select a category.");
      return;
    }

    if (discountPriceInvalid) {
      toast.error("Discount price must be less than the regular price.");
      return;
    }

    if (videoMode === "youtube" && !youtubePreviewId) {
      toast.error("Please paste a valid YouTube URL, or remove the video.");
      return;
    }

    const optionsError = validateProductOptions(options, {
      price: form.price,
      discountPrice: form.discountPrice,
    });
    if (optionsError) {
      toast.error(optionsError);
      return;
    }

    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("sku", form.sku);
    formData.set("category", form.category);
    formData.set("brand", form.brand);
    formData.set("shortDescription", form.shortDescription);
    formData.set("overview", form.overview);
    formData.set("price", form.price);
    if (form.discountPrice) formData.set("discountPrice", form.discountPrice);
    formData.set("unit", form.unit);
    formData.set("weight", form.weight);
    appendProductOptions(formData, options);
    formData.set(
      "vendor",
      form.productSource === "vendor" ? form.vendor : "",
    );
    formData.set("isFeatured", String(form.isFeatured));
    formData.set("isTrending", String(form.isTrending));
    formData.set("isBestSeller", String(form.isBestSeller));
    formData.set("isFreeDelivery", String(form.isFreeDelivery));
    formData.set("isNewArrival", String(form.isNewArrival));
    if (featureFile) {
      formData.set("featureImage", featureFile);
    } else if (removeFeatureImage) {
      formData.set("removeFeatureImage", "true");
    }
    if (showGallery) {
      formData.set("keepGalleryImages", JSON.stringify(keptGalleryImages));
      galleryFiles.forEach((file) => formData.append("galleryImages", file));
    } else {
      // Hidden step = left exactly as saved: nothing added, nothing removed.
      formData.set("keepGalleryImages", JSON.stringify(initialGalleryImages));
    }
    if (videoMode === "upload" && videoFile) {
      formData.set("video", videoFile);
      formData.set("videoSource", "upload");
    } else if (videoMode === "youtube" && youtubeUrlInput) {
      formData.set("videoSource", "youtube");
      formData.set("videoUrl", youtubeUrlInput.trim());
    } else if (removeVideo) {
      formData.set("removeVideo", "true");
    }
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
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. BOO-OW-1"
                />
                <p className="text-xs text-gray-500">
                  Auto-generated — edit it if you&apos;d rather set your own.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Descriptions
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Short Description</label>
                <RichTextEditor
                  value={form.shortDescription}
                  onChange={(html) =>
                    setForm((f) => ({ ...f, shortDescription: html }))
                  }
                  placeholder="A brief one- or two-line summary shown on product cards"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Overview</label>
                <RichTextEditor
                  value={form.overview}
                  onChange={(html) =>
                    setForm((f) => ({ ...f, overview: html }))
                  }
                  placeholder="Full product description shown on the product detail page"
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900">
                Images, Colors &amp; Sizes
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Work down the list: the main image, then colors, sizes and
                size prices, then a video. Gallery images are for products
                with no colors and no sizes.
              </p>
            </div>
            <FormSteps>
              <FormStep icon={<BiImageAdd />} title="Feature Image">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <button
                      type="button"
                      onClick={() => featureInputRef.current?.click()}
                      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary hover:text-primary transition-colors"
                    >
                      {featurePreview ? (
                        <Image
                          src={featurePreview}
                          alt="Preview"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BiImageAdd size={24} />
                      )}
                    </button>
                    {featurePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveFeatureImage}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove feature image"
                      >
                        <BiX size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    ref={featureInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFeatureChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    The main image shown on cards and at the top of the
                    product page.
                  </p>
                </div>
              </FormStep>

              <ProductOptionsEditor
                value={options}
                onChange={setOptions}
                pricing={{
                  price: form.price,
                  discountPrice: form.discountPrice,
                }}
                weightField={
                  <div className="space-y-1.5">
                    <label htmlFor="product-weight" className={labelClass}>
                      Weight / Volume
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Sized by wrappers: inputClass itself is full-width. */}
                      <div className="w-28">
                        <input
                          id="product-weight"
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.weight}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, weight: e.target.value }))
                          }
                          aria-label="Amount"
                          className={inputClass}
                        />
                      </div>
                      <div className="w-44">
                        <select
                          value={form.unit}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              unit: e.target.value as ProductUnit,
                            }))
                          }
                          aria-label="Unit"
                          className={inputClass}
                        >
                          {PRODUCT_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {UNIT_LABELS[u]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {form.weight !== "" && Number(form.weight) > 0 && (
                        <span className="text-sm text-gray-500">
                          Customers see{" "}
                          <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-800">
                            {Number(form.weight)} {form.unit}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      The amount in one item — for example 500 ml, 1 kg, or 1
                      pcs. It&apos;s shown on the product page.
                    </p>
                  </div>
                }
              />

              {showGallery ? (
                <FormStep icon={<BiImages />} title="Gallery Images">
                  <div className="flex flex-wrap items-center gap-3">
                    {keptGalleryImages.map((src, i) => (
                      <div key={`kept-${src}`} className="relative h-16 w-16 shrink-0">
                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                          <Image
                            src={src}
                            alt={`Gallery ${i + 1}`}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeptGalleryImage(i)}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove gallery image"
                        >
                          <BiX size={14} />
                        </button>
                      </div>
                    ))}
                    {galleryPreviews.map((src, i) => (
                      <div key={`new-${src}`} className="relative h-16 w-16 shrink-0">
                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                          <Image
                            src={src}
                            alt={`New gallery ${i + 1}`}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewGalleryImage(i)}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove gallery image"
                        >
                          <BiX size={14} />
                        </button>
                      </div>
                    ))}
                    {gallerySlotsLeft > 0 && (
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary hover:text-primary transition-colors"
                      >
                        <BiImageAdd size={24} />
                      </button>
                    )}
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleGalleryChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Up to {MAX_GALLERY_IMAGES} images ({gallerySlotsUsed}/
                    {MAX_GALLERY_IMAGES} used). Click the × on an image to
                    remove it.
                  </p>
                </FormStep>
              ) : (
                initialGalleryImages.length > 0 && (
                  <FormStep icon={<BiImages />} title="Gallery Images">
                    <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500">
                      Gallery images are only for products with no colors and
                      no sizes. This product&apos;s{" "}
                      {initialGalleryImages.length} saved gallery{" "}
                      {initialGalleryImages.length === 1 ? "image is" : "images are"}{" "}
                      kept as {initialGalleryImages.length === 1 ? "it is" : "they are"}{" "}
                      — set Color and Size back to None to edit{" "}
                      {initialGalleryImages.length === 1 ? "it" : "them"}.
                    </p>
                  </FormStep>
                )
              )}

              <FormStep icon={<BiVideo />} title="Product Video">

                {videoMode === "" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoMode("upload")}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                    >
                      <BiCloudUpload size={18} /> Upload Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode("youtube")}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                    >
                      <BiLogoYoutube size={18} /> YouTube Link
                    </button>
                  </div>
                )}

                {videoMode === "upload" && (
                  <div className="space-y-2">
                    {videoPreview ? (
                      <div className="relative w-full max-w-xs">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove video"
                        >
                          <BiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                        >
                          <BiCloudUpload size={18} /> Choose video file
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="text-xs text-gray-500 hover:text-red-500"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept={VIDEO_MIME_TYPES}
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      MP4, WEBM, or MOV, up to 50MB.
                    </p>
                  </div>
                )}

                {videoMode === "youtube" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        value={youtubeUrlInput}
                        onChange={(e) => {
                          setYoutubeUrlInput(e.target.value);
                          setRemoveVideo(false);
                        }}
                        placeholder="https://www.youtube.com/watch?v=…"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="shrink-0 text-xs text-gray-500 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    {youtubePreviewId && (
                      <Image
                        src={`https://img.youtube.com/vi/${youtubePreviewId}/hqdefault.jpg`}
                        alt="YouTube preview"
                        width={160}
                        height={90}
                        unoptimized
                        className="rounded-lg border border-gray-200"
                      />
                    )}
                  </div>
                )}
              </FormStep>
            </FormSteps>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Organization
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Category <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={categoryOptions}
                  value={form.category}
                  onChange={(id) =>
                    setForm((f) => ({ ...f, category: id }))
                  }
                  placeholder="Search category…"
                  emptyText="No categories found."
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Brand</label>
                {/* Searchable like Category. A brand is optional, so the
                    list starts with "None" and the box can be cleared; with
                    over a thousand brands only the first matches are shown
                    until a name is typed. */}
                <SearchSelect
                  options={brandOptions}
                  value={form.brand}
                  onChange={(id) => setForm((f) => ({ ...f, brand: id }))}
                  placeholder="Search brand…"
                  emptyText="No brands found."
                  allowClear
                  clearLabel="None"
                  maxVisible={60}
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <BiStore size={16} className="text-gray-400" />
              Product Source
            </h3>
            <div className="space-y-4">
              <div className="flex gap-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, productSource: "own" }))
                  }
                  className={`relative pb-2.5 text-sm font-semibold transition-colors ${
                    form.productSource === "own"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Own Product
                  <span
                    className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-black transition-transform duration-200 ${
                      form.productSource === "own"
                        ? "scale-x-100"
                        : "scale-x-0"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, productSource: "vendor" }))
                  }
                  className={`relative pb-2.5 text-sm font-semibold transition-colors ${
                    form.productSource === "vendor"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Vendor Product
                  <span
                    className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-black transition-transform duration-200 ${
                      form.productSource === "vendor"
                        ? "scale-x-100"
                        : "scale-x-0"
                    }`}
                  />
                </button>
              </div>

              {form.productSource === "vendor" && (
                <div className="space-y-1.5">
                  <label className={labelClass}>
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  {vendors.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No vendors yet — add one under Vendors first.
                    </p>
                  ) : (
                    <SearchSelect
                      options={vendors.map((v) => ({
                        id: v._id,
                        label: v.name,
                      }))}
                      value={form.vendor}
                      onChange={(id) =>
                        setForm((f) => ({ ...f, vendor: id }))
                      }
                      placeholder="Search vendor…"
                      emptyText="No vendors found."
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Pricing (BDT ৳)
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Regular Price <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Discount Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.discountPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discountPrice: e.target.value,
                    }))
                  }
                  className={`${inputClass} ${
                    discountPriceInvalid
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : ""
                  }`}
                  placeholder="Optional sale price"
                />
                {discountPriceInvalid && (
                  <p className="text-xs text-red-500">
                    Must be less than the regular price.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Visibility & Flags
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isFeatured: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Featured Product
                  </span>
                  <span className="block text-xs text-gray-500">
                    Highlighted in the featured products section.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isTrending}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isTrending: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Trending Product
                  </span>
                  <span className="block text-xs text-gray-500">
                    Shown in the trending products section.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isBestSeller: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Best Seller
                  </span>
                  <span className="block text-xs text-gray-500">
                    Shown in the best sellers section.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFreeDelivery}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      isFreeDelivery: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Free Delivery
                  </span>
                  <span className="block text-xs text-gray-500">
                    Marks this product as sold with free delivery.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isNewArrival: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    New Arrival
                  </span>
                  <span className="block text-xs text-gray-500">
                    {newArrivalDaysLeft !== null
                      ? `Shown in new arrivals — expires in ${newArrivalDaysLeft} day${newArrivalDaysLeft === 1 ? "" : "s"}.`
                      : "Shown in the new arrivals section for 30 days, then removed automatically."}
                  </span>
                </span>
              </label>
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

export default ProductForm;
