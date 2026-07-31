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
  // Rounding put 319 of 320 pages at "100%", which is the one number a
  // reader will argue with — a page still left is not a finished book.
  // Same at the bottom: a page in is not "0%".
  const exact = (safeRead / safeTotal) * 100;
  const pct =
    safeRead >= safeTotal
      ? 100
      : safeRead <= 0
        ? 0
        : Math.min(Math.max(Math.round(exact), 1), 99);

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
