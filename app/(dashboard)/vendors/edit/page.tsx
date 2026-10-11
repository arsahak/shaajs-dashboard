import { Suspense } from "react";
import VendorEdit from "@/components/vendors/VendorEdit";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <VendorEdit />
      </Suspense>
    </div>
  );
};

export default page;
