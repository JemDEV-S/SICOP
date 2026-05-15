import { SicopShellFrame } from "@/components/sicop/SicopShellFrame";
import { ReporteSkeleton } from "@/components/sicop/SicopSkeleton";

export default function Loading() {
  return (
    <SicopShellFrame>
      <ReporteSkeleton />
    </SicopShellFrame>
  );
}
