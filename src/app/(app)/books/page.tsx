import Link from "next/link";
import { Search } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { ManualEntryDialog } from "@/components/books/manual-entry-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { SHELF_LABELS } from "@/lib/shelf-labels";
import { cn } from "@/lib/utils";
import { ShelfEnum, type ShelfValue } from "@/lib/validators";

const TABS: { value: ShelfValue | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "READING", label: SHELF_LABELS.READING },
  { value: "WANT_TO_READ", label: SHELF_LABELS.WANT_TO_READ },
  { value: "READ", label: SHELF_LABELS.READ },
];

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const user = await requireCurrentUser();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My books</h1>
          <p className="text-muted-foreground text-sm">
            Everything you&apos;ve added, organised by shelf.
          </p>
        </div>
        <div className="flex gap-2">
          <ManualEntryDialog />
          <Link
            href="/books/search"
            className={buttonVariants({ size: "sm" })}
          >
            <Search className="mr-2 h-4 w-4" />
            Find books
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => {
          const isActive =
            (tab.value === "ALL" && !activeShelf) || tab.value === activeShelf;
          const href = tab.value === "ALL" ? "/books" : `/books?shelf=${tab.value}`;
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
              {activeShelf
                ? `No books on "${SHELF_LABELS[activeShelf]}" yet.`
                : "You haven't added any books yet."}
            </p>
            <Link
              href="/books/search"
              className={buttonVariants({ className: "mt-4" })}
            >
              Find your first book
            </Link>
          </CardContent>
        </Card>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
