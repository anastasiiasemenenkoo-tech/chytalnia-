import { BookCover } from "@/components/books/book-cover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";

export async function ClubReadingHistory({ clubId }: { clubId: string }) {
  const dict = await getDictionary();
  const locale = await getLocale();

  const history = await prisma.clubReadingHistory.findMany({
    where: { clubId, endedAt: { not: null } },
    include: { book: { select: { title: true, author: true, coverUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  function fmt(date: Date) {
    return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.clubs.historyTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {dict.clubs.historyEmpty}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <div className="w-14 shrink-0">
                  <BookCover src={h.book.coverUrl} alt={h.book.title} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.book.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {h.book.author}
                  </p>
                  {h.endedAt && (
                    <p className="text-muted-foreground text-xs">
                      {interpolate(dict.clubs.historyDateRange, {
                        start: fmt(h.startDate ?? h.createdAt),
                        end: fmt(h.endedAt),
                      })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
