import { Suspense } from "react";
import BrandAdd from "@/components/brand/BrandAdd";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <BrandAdd />
      </Suspense>
    </div>
  );
};

export default page;
