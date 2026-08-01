import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { BookCover } from "@/components/books/book-cover";
import { ReadingProgressBar } from "@/components/books/reading-progress-bar";
import { StarRating } from "@/components/books/star-rating";
import { FollowButton } from "@/components/readers/follow-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SHELF_ORDER } from "@/lib/shelf-labels";
import type { ShelfValue } from "@/lib/validators";

function initials(name: string | null, fallback: string) {
  const src = (name ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ReaderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireCurrentUser();
  const dict = await getDictionary();

  // No email in the select. A profile is a reading life, not a contact card.
  const reader = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!reader) notFound();

  const isMe = reader.id === me.id;

  const [books, iFollow, followsMe, followerCount, followingCount] =
    await Promise.all([
      prisma.userBook.findMany({
        where: { userId: reader.id },
        // `notes` is deliberately absent: private, and not part of a shelf.
        select: {
          id: true,
          shelf: true,
          rating: true,
          review: true,
          pagesRead: true,
          totalPages: true,
          book: { select: { title: true, author: true, coverUrl: true } },
        },
        orderBy: { addedAt: "desc" },
      }),
      isMe
        ? null
        : prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: me.id,
                followingId: reader.id,
              },
            },
            select: { id: true },
          }),
      isMe
        ? null
        : prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: reader.id,
                followingId: me.id,
              },
            },
            select: { id: true },
          }),
      prisma.follow.count({ where: { followingId: reader.id } }),
      prisma.follow.count({ where: { followerId: reader.id } }),
    ]);

  const isFollowing = !!iFollow;
  const isMutual = !!iFollow && !!followsMe;
  const displayName = reader.name ?? dict.common.unnamedReader;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/readers"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" }),
        )}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {dict.readers.backToReaders}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials(reader.name, "?")}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
              {isMutual && (
                <Badge variant="secondary">{dict.readers.friend}</Badge>
              )}
            </div>
            <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              {interpolate(dict.readers.followCounts, {
                followers: followerCount,
                following: followingCount,
              })}
            </p>
          </div>
        </div>
        {!isMe && (
          <FollowButton readerId={reader.id} isFollowing={isFollowing} />
        )}
      </header>

      <Separator />

      {books.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {dict.readers.noBooks}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {SHELF_ORDER.map((shelf) => {
            const onShelf = books.filter((b) => b.shelf === shelf);
            if (onShelf.length === 0) return null;
            return (
              <Card key={shelf}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {dict.shelves[shelf as ShelfValue]}{" "}
                    <span className="text-muted-foreground font-normal">
                      · {onShelf.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {onShelf.map((ub) => (
                      <li key={ub.id} className="flex gap-3">
                        <BookCover
                          src={ub.book.coverUrl}
                          alt={ub.book.title}
                          className="w-10 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-medium">
                            {ub.book.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {ub.book.author}
                          </p>
                          {ub.rating != null && (
                            <StarRating rating={ub.rating} readOnly />
                          )}
                          {shelf === "READING" && (
                            <ReadingProgressBar
                              pagesRead={ub.pagesRead}
                              totalPages={ub.totalPages}
                            />
                          )}
                          {ub.review && (
                            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                              {ub.review}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
