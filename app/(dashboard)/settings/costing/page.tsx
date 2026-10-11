import CostingView from "@/components/costing/CostingView";
import { auth } from "@/auth";

export default async function CostingPage() {
  const session = await auth();
  return <CostingView canDelete={session?.user?.role === "superadmin"} />;
}
