"use client";

import { Product } from "@/app/actions/product";
import { Supplier } from "@/app/actions/supplier";
import { useState } from "react";

export type StockFormValues = {
  product: string;
  supplier: string;
  quantity: string;
  costPrice: string;
  note: string;
};

export const EMPTY_STOCK_FORM: StockFormValues = {
  product: "",
  supplier: "",
  quantity: "1",
  costPrice: "",
  note: "",
};

interface StockFormProps {
  products: Product[];
  suppliers: Supplier[];
  initialValues?: StockFormValues;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: StockFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";

const StockForm = ({
  products,
  suppliers,
  initialValues = EMPTY_STOCK_FORM,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: StockFormProps) => {
  const [form, setForm] = useState<StockFormValues>(initialValues);

  const selectedProduct = products.find((p) => p._id === form.product);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Stock Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.product}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, product: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select a product
                  </option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.sku})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-gray-500">
                    Current stock: {selectedProduct.stock} unit
                    {selectedProduct.stock === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select a supplier
                  </option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Note</label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  className={`${inputClass} resize-none`}
                  placeholder="Optional note about this delivery"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded border border-gray-200 p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Quantity &amp; Cost
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  className={inputClass}
                />
                <p className="text-xs text-gray-500">
                  Units received — added to the product&apos;s stock.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Cost Price (per unit)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, costPrice: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Price paid to the supplier"
                />
              </div>
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

export default StockForm;
