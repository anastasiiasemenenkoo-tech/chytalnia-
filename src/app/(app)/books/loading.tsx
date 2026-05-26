import {
  BookGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/shell/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withActions />
      <div className="flex gap-3 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
      <BookGridSkeleton />
    </div>
  );
}
