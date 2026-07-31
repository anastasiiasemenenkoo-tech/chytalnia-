import Link from "next/link";
import { Search, Upload } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { BookShelfRow } from "@/components/books/book-shelf-row";
import { ManualEntryDialog } from "@/components/books/manual-entry-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { ShelfEnum, type ShelfValue } from "@/lib/validators";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const { shelf: shelfParam } = await searchParams;

  const shelfParse = ShelfEnum.safeParse(shelfParam);
  const activeShelf: ShelfValue | null = shelfParse.success
    ? shelfParse.data
    : null;

  const userBooks = await prisma.userBook.findMany({
    where: {
      userId: user.id,
      ...(activeShelf ? { shelf: activeShelf } : {}),
    },
    include: { book: true },
    orderBy: [{ shelf: "asc" }, { addedAt: "desc" }],
  });

  // The unfiltered view is a wall of shelves; picking a tab drops you into
  // the working view where every book carries its full set of controls.
  const SHELF_ORDER: ShelfValue[] = [
    "READING",
    "WANT_TO_READ",
    "READ",
    "ABANDONED",
  ];

  const tabs: { value: ShelfValue | "ALL"; label: string }[] = [
    { value: "ALL", label: dict.books.tabAll },
    { value: "READING", label: dict.shelves.READING },
    { value: "WANT_TO_READ", label: dict.shelves.WANT_TO_READ },
    { value: "READ", label: dict.shelves.READ },
    { value: "ABANDONED", label: dict.shelves.ABANDONED },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.books.title}
          </h1>
          <p className="text-muted-foreground text-sm">{dict.books.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ManualEntryDialog />
          <Link
            href="/books/import"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Upload className="mr-2 h-4 w-4" />
            {dict.books.importLink}
          </Link>
          <Link
            href="/books/search"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Search className="mr-2 h-4 w-4" />
            {dict.books.findBooks}
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b">
        {tabs.map((tab) => {
          const isActive =
            (tab.value === "ALL" && !activeShelf) || tab.value === activeShelf;
          const href =
            tab.value === "ALL" ? "/books" : `/books?shelf=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors -mb-px",
                isActive
                  ? "border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {userBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {activeShelf === "ABANDONED"
                ? dict.books.emptyAbandoned
                : activeShelf
                  ? interpolate(dict.books.emptyShelf, {
                      label: dict.shelves[activeShelf],
                    })
                  : dict.books.emptyAll}
            </p>
            <Link
              href="/books/search"
              className={cn(buttonVariants({ className: "mt-4" }))}
            >
              {dict.books.findFirst}
            </Link>
          </CardContent>
        </Card>
      ) : !activeShelf ? (
        <div className="space-y-8">
          {SHELF_ORDER.map((shelf, i) => (
            <BookShelfRow
              key={shelf}
              shelf={shelf}
              label={dict.shelves[shelf]}
              // Alternating props keep four identical rows from reading as a
              // spreadsheet without turning the page into a still life.
              decor={i % 2 === 0 ? "plant" : "stack"}
              books={userBooks
                .filter((ub) => ub.shelf === shelf)
                .map((ub) => ({
                  id: ub.id,
                  title: ub.book.title,
                  author: ub.book.author,
                  coverUrl: ub.book.coverUrl,
                }))}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userBooks.map((ub) => (
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
    </div>
  );
}
