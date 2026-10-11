import { Suspense } from "react";
import StockAdd from "@/components/stock/StockAdd";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <StockAdd />
      </Suspense>
    </div>
  );
};

export default page;
