import { Suspense } from "react";
import StockList from "@/components/stock/StockList";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <StockList />
      </Suspense>
    </div>
  );
};

export default page;
