import { Progress } from "@/components/ui/progress";

export function ReadingProgressBar({
  pagesRead,
  totalPages,
  className,
}: {
  pagesRead: number | null;
  totalPages: number | null;
  className?: string;
}) {
  if (pagesRead == null || !totalPages) return null;

  const safeTotal = Math.max(totalPages, 1);
  const safeRead = Math.min(Math.max(pagesRead, 0), safeTotal);
  const pct = Math.round((safeRead / safeTotal) * 100);

  return (
    <div className={className}>
      <Progress value={pct} className="h-1.5" />
      <p className="text-muted-foreground mt-1 text-xs">
        {safeRead} / {safeTotal} pages · {pct}%
      </p>
    </div>
  );
}
