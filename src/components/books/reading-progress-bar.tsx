"use client";

import { Progress } from "@/components/ui/progress";
import { useDict } from "@/i18n/provider";
import { interpolate } from "@/i18n/interpolate";

export function ReadingProgressBar({
  pagesRead,
  totalPages,
  className,
}: {
  pagesRead: number | null;
  totalPages: number | null;
  className?: string;
}) {
  const dict = useDict();
  if (pagesRead == null || !totalPages) return null;

  const safeTotal = Math.max(totalPages, 1);
  const safeRead = Math.min(Math.max(pagesRead, 0), safeTotal);
  const pct = Math.round((safeRead / safeTotal) * 100);

  return (
    <div className={className}>
      <Progress value={pct} className="h-1.5" />
      <p className="text-muted-foreground mt-1 text-xs">
        {interpolate(dict.books.progressPages, {
          read: safeRead,
          total: safeTotal,
          pct,
        })}
      </p>
    </div>
  );
}
