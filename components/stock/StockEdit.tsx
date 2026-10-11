"use client";

import { Product, listProductsAction } from "@/app/actions/product";
import {
  Stock,
  StockProductRef,
  StockSupplierRef,
  getStockAction,
  updateStockAction,
} from "@/app/actions/stock";
import { Supplier, listSuppliersAction } from "@/app/actions/supplier";
import StockForm, { StockFormValues } from "./StockForm";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const StockEdit = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No stock entry selected.");
      setLoading(false);
      return;
    }

    (async () => {
      const [stockRes, productsRes, suppliersRes] = await Promise.all([
        getStockAction(id),
        listProductsAction({ limit: 100 }),
        listSuppliersAction(),
      ]);

      if (stockRes.ok && stockRes.data) {
        setStock(stockRes.data);
      } else {
        setError(stockRes.error || "Stock entry not found.");
      }

      if (productsRes.ok && productsRes.data) {
        setProducts(productsRes.data.products);
      }
      if (suppliersRes.ok && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (values: StockFormValues) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await updateStockAction(id, {
        product: values.product,
        supplier: values.supplier,
        quantity: Number(values.quantity),
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        note: values.note || undefined,
      });
      if (res.ok) {
        toast.success("Stock entry updated");
        router.push("/inventory/stock");
      } else {
        toast.error(
          res.fieldErrors?.join(" ") ||
            res.error ||
            "Failed to update stock entry",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const productId =
    typeof stock?.product === "string"
      ? stock.product
      : (stock?.product as StockProductRef | undefined)?._id;

  const supplierId =
    typeof stock?.supplier === "string"
      ? stock.supplier
      : (stock?.supplier as StockSupplierRef | undefined)?._id;

  const initialValues: StockFormValues | undefined = stock
    ? {
        product: productId || "",
        supplier: supplierId || "",
        quantity: String(stock.quantity),
        costPrice: stock.costPrice !== undefined ? String(stock.costPrice) : "",
        note: stock.note || "",
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Stock Entry
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update this stock entry
            </p>
          </div>
          <Link
            href="/inventory/stock"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={18} />
            Back to Stock
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
              <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      ) : error || !stock ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            {error || "Could not load this stock entry."}
          </p>
          <Link
            href="/inventory/stock"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BiArrowBack size={16} /> Back to Stock
          </Link>
        </div>
      ) : (
        <StockForm
          products={products}
          suppliers={suppliers}
          initialValues={initialValues}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/inventory/stock")}
        />
      )}
    </div>
  );
};

export default StockEdit;
