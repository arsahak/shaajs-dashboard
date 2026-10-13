import { Suspense } from "react";
import BestForAdd from "@/components/bestFor/BestForAdd";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <BestForAdd />
      </Suspense>
    </div>
  );
};

export default page;
