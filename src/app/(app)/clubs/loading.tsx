import {
  ClubGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/shell/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton withActions />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <ClubGridSkeleton />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <ClubGridSkeleton />
      </div>
    </div>
  );
}
