import {
  BookGridSkeleton,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/shell/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <BookGridSkeleton count={3} />
    </div>
  );
}
