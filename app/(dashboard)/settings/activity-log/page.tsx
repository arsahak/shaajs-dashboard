import { Suspense } from "react";
import ActivityLogView from "@/components/activity/ActivityLogView";

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <ActivityLogView />
      </Suspense>
    </div>
  );
};

export default page;
