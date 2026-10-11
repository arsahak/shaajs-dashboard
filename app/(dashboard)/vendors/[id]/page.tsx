import { Suspense } from "react";
import VendorDetails from "@/components/vendors/VendorDetails";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <VendorDetails />
      </Suspense>
    </div>
  );
};

export default page;
