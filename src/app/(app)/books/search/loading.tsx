import {
  BookGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/shell/page-skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
      <BookGridSkeleton />
    </div>
  );
}
