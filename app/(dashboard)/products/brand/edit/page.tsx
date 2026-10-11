import { Suspense } from "react";
import BrandEdit from "@/components/brand/BrandEdit";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <BrandEdit />
      </Suspense>
    </div>
  );
};

export default page;
