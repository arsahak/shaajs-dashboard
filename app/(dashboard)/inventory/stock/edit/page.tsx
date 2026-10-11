import { Suspense } from "react";
import StockEdit from "@/components/stock/StockEdit";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <StockEdit />
      </Suspense>
    </div>
  );
};

export default page;
