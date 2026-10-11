import { Suspense } from "react";
import BrandList from "@/components/brand/BrandList";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <BrandList />
      </Suspense>
    </div>
  );
};

export default page;
