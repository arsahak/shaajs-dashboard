import { Suspense } from "react";
import BestForList from "@/components/bestFor/BestForList";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <BestForList />
      </Suspense>
    </div>
  );
};

export default page;
