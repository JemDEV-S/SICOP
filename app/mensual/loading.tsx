import { SicopShellFrame } from "@/components/sicop/SicopShellFrame";
import { MensualSkeleton } from "@/components/sicop/SicopSkeleton";

export default function Loading() {
  return (
    <SicopShellFrame>
      <MensualSkeleton />
    </SicopShellFrame>
  );
}
