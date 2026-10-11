import { Suspense } from "react";
import VendorAdd from "@/components/vendors/VendorAdd";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <VendorAdd />
      </Suspense>
    </div>
  );
};

export default page;
