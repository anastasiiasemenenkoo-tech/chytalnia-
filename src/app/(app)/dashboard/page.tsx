import Link from "next/link";
import { ArrowRight, Library, Search, Users } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { YearlyGoalCard } from "@/components/dashboard/yearly-goal-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import type { ShelfValue } from "@/lib/validators";

const SHELVES: ShelfValue[] = ["WANT_TO_READ", "READING", "READ"];

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);

  const [grouped, currentlyReading, clubCount, readThisYear, userRecord] =
    await Promise.all([
      prisma.userBook.groupBy({
        by: ["shelf"],
        where: { userId: user.id },
        _count: { shelf: true },
      }),
      prisma.userBook.findMany({
        where: { userId: user.id, shelf: "READING" },
        include: { book: true },
        orderBy: { addedAt: "desc" },
        take: 6,
      }),
      prisma.clubMembership.count({ where: { userId: user.id } }),
      prisma.userBook.count({
        where: {
          userId: user.id,
          shelf: "READ",
          finishedAt: { gte: yearStart },
        },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { yearlyGoal: true },
      }),
    ]);

  const counts = Object.fromEntries(
    grouped.map((g) => [g.shelf, g._count.shelf]),
  ) as Partial<Record<ShelfValue, number>>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.dashboard.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {dict.dashboard.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SHELVES.map((shelf) => (
          <Card key={shelf}>
            <CardHeader className="pb-2">
              <CardDescription>{dict.shelves[shelf]}</CardDescription>
              <CardTitle className="text-3xl">{counts[shelf] ?? 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/books?shelf=${shelf}`}
                className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs"
              >
                {dict.dashboard.view} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{dict.dashboard.bookClubsCard}</CardDescription>
            <CardTitle className="text-3xl">{clubCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/clubs"
              className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs"
            >
              {dict.dashboard.browse} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <YearlyGoalCard
        goal={userRecord?.yearlyGoal ?? null}
        readThisYear={readThisYear}
        year={year}
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {dict.dashboard.currentlyReading}
          </h2>
          <div className="flex gap-2">
            <Link
              href="/books/search"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Search className="mr-2 h-4 w-4" />
              {dict.dashboard.findBooks}
            </Link>
            <Link
              href="/books"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Library className="mr-2 h-4 w-4" />
              {dict.dashboard.allMyBooks}
            </Link>
            <Link
              href="/clubs"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Users className="mr-2 h-4 w-4" />
              {dict.dashboard.clubs}
            </Link>
          </div>
        </div>

        {currentlyReading.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {dict.dashboard.notReadingYet}
              </p>
              <Link
                href="/books/search"
                className={buttonVariants({ className: "mt-4" })}
              >
                {dict.dashboard.findYourNextBook}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentlyReading.map((ub) => (
              <BookCard
                key={ub.id}
                userBookId={ub.id}
                title={ub.book.title}
                author={ub.book.author}
                coverUrl={ub.book.coverUrl}
                shelf={ub.shelf as ShelfValue}
                finishedAt={ub.finishedAt}
                pagesRead={ub.pagesRead}
                totalPages={ub.totalPages}
                rating={ub.rating}
                review={ub.review}
                notes={ub.notes}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
