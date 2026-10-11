import { Suspense } from "react";
import SupplierEdit from "@/components/supplier/SupplierEdit";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <SupplierEdit />
      </Suspense>
    </div>
  );
};

export default page;
