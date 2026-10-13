import { Suspense } from "react";
import BestForEdit from "@/components/bestFor/BestForEdit";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <BestForEdit />
      </Suspense>
    </div>
  );
};

export default page;
