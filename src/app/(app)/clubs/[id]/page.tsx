import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { BookCover } from "@/components/books/book-cover";
import { ReadingProgressBar } from "@/components/books/reading-progress-bar";
import { ReadingProgressDialog } from "@/components/books/reading-progress-dialog";
import { JoinLeaveButton } from "@/components/clubs/join-leave-button";
import { SetCurrentBook } from "@/components/clubs/set-current-book";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

function initials(input: string | null, fallback: string) {
  const src = (input ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const club = await prisma.bookClub.findUnique({
    where: { id },
    include: {
      currentlyReadingBook: true,
      owner: { select: { id: true, name: true, email: true } },
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!club) notFound();

  const myMembership = club.memberships.find((m) => m.userId === user.id);
  const isOwner = club.ownerId === user.id;
  const isMember = !!myMembership;

  const myUserBookForClub = club.currentlyReadingBookId
    ? await prisma.userBook.findUnique({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: club.currentlyReadingBookId,
          },
        },
        select: { id: true, pagesRead: true, totalPages: true },
      })
    : null;

  const myBooks = isOwner
    ? await prisma.userBook.findMany({
        where: { userId: user.id },
        include: {
          book: { select: { id: true, title: true, author: true } },
        },
        orderBy: { addedAt: "desc" },
      })
    : [];

  const ownerBookOptions = myBooks.map((ub) => ({
    id: ub.book.id,
    title: ub.book.title,
    author: ub.book.author,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/clubs"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2",
        })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to clubs
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {club.name}
            </h1>
            {isOwner && <Badge variant="secondary">Owner</Badge>}
          </div>
          {club.description && (
            <p className="text-muted-foreground text-sm">{club.description}</p>
          )}
          <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {club.memberships.length}{" "}
            {club.memberships.length === 1 ? "member" : "members"}
          </p>
        </div>
        <JoinLeaveButton
          clubId={club.id}
          isMember={isMember}
          isOwner={isOwner}
        />
      </header>

      <Separator />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currently reading</CardTitle>
            <CardDescription>
              {isOwner
                ? "Pick what the club is reading from your shelves."
                : "Set by the owner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {club.currentlyReadingBook ? (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="w-20 shrink-0">
                    <BookCover
                      src={club.currentlyReadingBook.coverUrl}
                      alt={club.currentlyReadingBook.title}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">
                      {club.currentlyReadingBook.title}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {club.currentlyReadingBook.author}
                    </p>
                    {myUserBookForClub && (
                      <ReadingProgressBar
                        className="mt-3"
                        pagesRead={myUserBookForClub.pagesRead}
                        totalPages={myUserBookForClub.totalPages}
                      />
                    )}
                  </div>
                </div>
                {myUserBookForClub ? (
                  <ReadingProgressDialog
                    userBookId={myUserBookForClub.id}
                    title={club.currentlyReadingBook.title}
                    pagesRead={myUserBookForClub.pagesRead}
                    totalPages={myUserBookForClub.totalPages}
                  />
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Add this book to your shelves to track your progress.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No book selected yet.
              </p>
            )}
            {isOwner && (
              <SetCurrentBook
                clubId={club.id}
                currentBookId={club.currentlyReadingBookId}
                options={ownerBookOptions}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {club.memberships.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials(m.user.name, m.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {m.user.name ?? m.user.email}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {m.user.email}
                      </p>
                    </div>
                  </div>
                  {m.role === "OWNER" && (
                    <Badge variant="secondary">Owner</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
