"use client";

import { Product, listProductsAction } from "@/app/actions/product";
import { createStockAction } from "@/app/actions/stock";
import { Supplier, listSuppliersAction } from "@/app/actions/supplier";
import StockForm, { StockFormValues } from "./StockForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";

const StockAdd = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [productsRes, suppliersRes] = await Promise.all([
        listProductsAction({ limit: 100 }),
        listSuppliersAction(),
      ]);
      if (productsRes.ok && productsRes.data) {
        setProducts(productsRes.data.products);
      }
      if (suppliersRes.ok && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (values: StockFormValues) => {
    setSubmitting(true);
    try {
      const res = await createStockAction({
        product: values.product,
        supplier: values.supplier,
        quantity: Number(values.quantity),
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        note: values.note || undefined,
      });
      if (res.ok) {
        toast.success("Stock added");
        router.push("/inventory/stock");
      } else {
        toast.error(
          res.fieldErrors?.join(" ") || res.error || "Failed to add stock",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const noOptions =
    !loading && (products.length === 0 || suppliers.length === 0);

  return (
    <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
            <p className="text-sm text-gray-500 mt-1">
              Record stock received from a supplier for a product
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
      ) : noOptions ? (
        <div className="rounded border border-gray-200 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            {products.length === 0
              ? "You need at least one product before adding stock."
              : "You need at least one supplier before adding stock."}
          </p>
          <Link
            href={products.length === 0 ? "/products/add" : "/inventory/supplier/add"}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
          >
            {products.length === 0 ? "Add a Product" : "Add a Supplier"}
          </Link>
        </div>
      ) : (
        <StockForm
          products={products}
          suppliers={suppliers}
          submitting={submitting}
          submitLabel="Add Stock"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/inventory/stock")}
        />
      )}
    </div>
  );
};

export default StockAdd;
