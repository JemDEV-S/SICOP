import { SicopShellFrame } from "@/components/sicop/SicopShellFrame";
import { InversionesSkeleton } from "@/components/sicop/SicopSkeleton";

export default function Loading() {
  return (
    <SicopShellFrame>
      <InversionesSkeleton />
    </SicopShellFrame>
  );
}
