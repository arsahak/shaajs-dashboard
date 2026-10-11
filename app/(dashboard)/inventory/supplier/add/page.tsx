import { Suspense } from "react";
import SupplierAdd from "@/components/supplier/SupplierAdd";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <SupplierAdd />
      </Suspense>
    </div>
  );
};

export default page;
