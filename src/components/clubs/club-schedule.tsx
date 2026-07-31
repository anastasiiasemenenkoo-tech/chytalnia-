import type { ReactNode } from "react";

import { ClubScheduleForm } from "@/components/clubs/club-schedule-form";
import { Badge } from "@/components/ui/badge";
import { getDictionary, getLocale } from "@/i18n";
import { plural } from "@/i18n/plural";
import { prisma } from "@/lib/db";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export async function ClubSchedule({
  clubId,
  isOwner,
}: {
  clubId: string;
  isOwner: boolean;
}) {
  const dict = await getDictionary();
  const locale = await getLocale();

  const active = await prisma.clubReadingHistory.findFirst({
    where: { clubId, endedAt: null },
    orderBy: { createdAt: "desc" },
  });

  function fmt(date: Date) {
    return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  let statusBadge: ReactNode = null;
  if (active?.dueDate) {
    const diffDays = Math.ceil(
      (active.dueDate.getTime() - new Date().getTime()) / 86_400_000,
    );
    if (diffDays < 0) {
      statusBadge = (
        <Badge variant="destructive">{dict.clubs.scheduleOverdue}</Badge>
      );
    } else if (diffDays === 0) {
      statusBadge = <Badge variant="secondary">{dict.clubs.scheduleDueToday}</Badge>;
    } else {
      statusBadge = (
        <Badge variant="secondary">
          {plural(dict.clubs.scheduleDaysLeft, diffDays, locale)}
        </Badge>
      );
    }
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{dict.clubs.scheduleTitle}</p>
        {statusBadge}
      </div>
      {active?.startDate || active?.dueDate ? (
        <p className="text-muted-foreground text-xs">
          {[
            active.startDate && `${dict.clubs.scheduleStartLabel}: ${fmt(active.startDate)}`,
            active.dueDate && `${dict.clubs.scheduleDueLabel}: ${fmt(active.dueDate)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">{dict.clubs.scheduleNotSet}</p>
      )}
      {isOwner && (
        <ClubScheduleForm
          clubId={clubId}
          startDate={toDateInputValue(active?.startDate ?? null)}
          dueDate={toDateInputValue(active?.dueDate ?? null)}
        />
      )}
    </div>
  );
}
