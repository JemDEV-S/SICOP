import { SicopShellFrame } from "@/components/sicop/SicopShellFrame";
import { DashboardSkeleton } from "@/components/sicop/SicopSkeleton";

export default function Loading() {
  return (
    <SicopShellFrame>
      <DashboardSkeleton />
    </SicopShellFrame>
  );
}
