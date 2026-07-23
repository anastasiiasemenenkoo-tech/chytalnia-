import { Star } from "lucide-react";

import { StarRating } from "@/components/books/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";

function initials(input: string | null, fallback: string) {
  const src = (input ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function ClubReviews({
  clubId,
  bookId,
  memberIds,
  bookTitle,
}: {
  clubId: string;
  bookId: string;
  memberIds: string[];
  bookTitle: string;
}) {
  const dict = await getDictionary();
  const locale = await getLocale();

  // Scope to the club's current reading cycle so a review left before this
  // cycle started (e.g. from an earlier time the club read the same book)
  // doesn't resurface as if it were about this read-through.
  const activeCycle = await prisma.clubReadingHistory.findFirst({
    where: { clubId, bookId, endedAt: null },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const reviews = await prisma.userBook.findMany({
    where: {
      bookId,
      userId: { in: memberIds },
      AND: [
        { OR: [{ rating: { not: null } }, { review: { not: null } }] },
        ...(activeCycle
          ? [
              {
                OR: [
                  { ratedAt: { gte: activeCycle.createdAt } },
                  { reviewUpdatedAt: { gte: activeCycle.createdAt } },
                ],
              },
            ]
          : []),
      ],
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ reviewUpdatedAt: "desc" }, { ratedAt: "desc" }],
  });

  const rated = reviews.filter((r) => r.rating != null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
      : null;

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{dict.clubs.reviewsTitle}</CardTitle>
          <CardDescription>
            {interpolate(dict.clubs.reviewsEmpty, { book: bookTitle })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{dict.clubs.reviewsTitle}</CardTitle>
            <CardDescription>
              {interpolate(dict.clubs.reviewsFrom, { book: bookTitle })}
            </CardDescription>
          </div>
          {avgRating != null && (
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-base font-medium">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)}
              </div>
              <p className="text-muted-foreground text-xs">
                {rated.length === 1
                  ? dict.clubs.ratingOne
                  : interpolate(dict.clubs.ratingMany, { n: rated.length })}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {initials(r.user.name, r.user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {r.user.name ?? r.user.email}
                  </span>
                  {r.rating != null && (
                    <StarRating rating={r.rating} readOnly />
                  )}
                </div>
                {r.review && (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {r.review}
                  </p>
                )}
                {r.reviewUpdatedAt && (
                  <p className="text-muted-foreground text-xs">
                    {r.reviewUpdatedAt.toLocaleDateString(
                      locale === "uk" ? "uk-UA" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
