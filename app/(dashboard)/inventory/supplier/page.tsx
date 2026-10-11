import { Suspense } from "react";
import SupplierList from "@/components/supplier/SupplierList";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <SupplierList />
      </Suspense>
    </div>
  );
};

export default page;
