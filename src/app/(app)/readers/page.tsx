import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import { FollowButton } from "@/components/readers/follow-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

const FEED_LIMIT = 20;

function initials(name: string | null) {
  const src = (name ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ReadersPage() {
  const me = await requireCurrentUser();
  const dict = await getDictionary();
  const locale = await getLocale();

  const [following, followers] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: me.id },
      select: { following: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.findMany({
      where: { followingId: me.id },
      select: { follower: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const followingIds = following.map((f) => f.following.id);
  const followerIds = new Set(followers.map((f) => f.follower.id));
  const mutualIds = new Set(followingIds.filter((id) => followerIds.has(id)));

  // The feed is derived from finished books rather than an activity log:
  // the app already records when a book was finished, and a second source of
  // truth is a second thing to keep correct.
  const feed = followingIds.length
    ? await prisma.userBook.findMany({
        where: {
          userId: { in: followingIds },
          shelf: "READ",
          finishedAt: { not: null },
        },
        select: {
          id: true,
          finishedAt: true,
          rating: true,
          user: { select: { id: true, name: true } },
          book: { select: { title: true, author: true, coverUrl: true } },
        },
        orderBy: { finishedAt: "desc" },
        take: FEED_LIMIT,
      })
    : [];

  const dateFormat = new Intl.DateTimeFormat(
    locale === "uk" ? "uk-UA" : "en-US",
    { day: "numeric", month: "short", year: "numeric" },
  );

  const people = [
    ...following.map((f) => f.following),
    ...followers
      .map((f) => f.follower)
      .filter((p) => !followingIds.includes(p.id)),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.readers.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {dict.readers.subtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.readers.feedTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {followingIds.length === 0
                ? dict.readers.feedNobody
                : dict.readers.feedQuiet}
            </p>
          ) : (
            <ul className="space-y-4">
              {feed.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <BookCover
                    src={entry.book.coverUrl}
                    alt={entry.book.title}
                    className="w-10 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm">
                      <Link
                        href={`/readers/${entry.user.id}`}
                        className="font-medium hover:underline"
                      >
                        {entry.user.name ?? dict.common.unnamedReader}
                      </Link>{" "}
                      <span className="text-muted-foreground">
                        {dict.readers.feedFinished}
                      </span>{" "}
                      <span className="font-medium">{entry.book.title}</span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {entry.book.author}
                      {entry.finishedAt
                        ? ` · ${dateFormat.format(entry.finishedAt)}`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {dict.readers.peopleTitle}{" "}
            <span className="text-muted-foreground font-normal">
              ·{" "}
              {interpolate(dict.readers.peopleCounts, {
                following: followingIds.length,
                followers: followers.length,
              })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {dict.readers.peopleEmpty}
            </p>
          ) : (
            <ul className="space-y-3">
              {people.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/readers/${person.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm hover:underline">
                        {person.name ?? dict.common.unnamedReader}
                      </span>
                      {mutualIds.has(person.id) ? (
                        <Badge variant="secondary" className="mt-0.5">
                          {dict.readers.friend}
                        </Badge>
                      ) : !followingIds.includes(person.id) ? (
                        <span className="text-muted-foreground text-xs">
                          {dict.readers.followsYou}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <FollowButton
                    readerId={person.id}
                    isFollowing={followingIds.includes(person.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
