"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  BookSpine,
  SPINE_MAX_HEIGHT,
  spineColour,
} from "@/components/books/book-spine";
import { ShelfBookStack, ShelfPlant } from "@/components/books/shelf-decor";
import { useDict, useLocale } from "@/i18n/provider";
import { plural } from "@/i18n/plural";
import { cn } from "@/lib/utils";
import type { ShelfValue } from "@/lib/validators";

export type ShelfBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

/**
 * Below this a row is too sparse for the trick to read as anything but a
 * mistake, so every book stays standing.
 */
const LYING_THRESHOLD = 6;
const LYING_COUNT = 2;

/**
 * An empty row still has to reserve height, but reserving a spine's worth of
 * it leaves a hole the size of a book you don't own. Tall enough for the
 * plant that keeps the shelf from looking abandoned, and no taller.
 */
const EMPTY_SHELF_HEIGHT = 96;

export function BookShelfRow({
  shelf,
  label,
  books,
  decor,
}: {
  shelf: ShelfValue;
  label: string;
  books: ShelfBook[];
  decor: "plant" | "stack" | "none";
}) {
  const dict = useDict();
  const locale = useLocale();
  const scroller = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // 1px of slack: sub-pixel widths otherwise leave the right arrow live
    // on a row that is already scrolled to its end.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    syncArrows();
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncArrows]);

  function scrollBy(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const lying =
    books.length >= LYING_THRESHOLD ? books.slice(-LYING_COUNT) : [];
  const standing = books.length >= LYING_THRESHOLD
    ? books.slice(0, -LYING_COUNT)
    : books;

  return (
    <section className="space-y-2">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg">{label}</h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/books?shelf=${shelf}`}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            {plural(dict.books.bookCount, books.length, locale)}
          </Link>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label={dict.books.scrollLeft}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label={dict.books.scrollRight}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative">
        <div
          ref={scroller}
          onScroll={syncArrows}
          className={cn(
            // gap-px, not a real gap: books on a shelf touch each other.
            // px-8 is what keeps a hovered cover from being clipped when the
            // book it belongs to sits at either end of the row.
            "flex items-end gap-px overflow-x-auto scroll-smooth px-8 pt-2",
            // The plank is the visual edge of this row, so the native
            // scrollbar would only cut across it.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          style={{
            minHeight:
              books.length === 0 ? EMPTY_SHELF_HEIGHT : SPINE_MAX_HEIGHT + 8,
          }}
        >
          {books.length === 0 ? (
            <>
              <p className="text-muted-foreground mr-4 self-end pb-2 text-sm">
                {dict.books.shelfEmpty}
              </p>
              {decor === "plant" && <ShelfPlant />}
              {decor === "stack" && <ShelfBookStack />}
            </>
          ) : (
            <>
              {standing.map((book) => (
                <BookSpine
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl}
                  shelf={shelf}
                />
              ))}
              {lying.length > 0 && (
                <span className="ml-3 flex shrink-0 flex-col justify-end gap-1 self-end">
                  {lying.map((book) => (
                    <LyingBook key={book.id} book={book} shelf={shelf} />
                  ))}
                </span>
              )}
              {decor === "plant" && <ShelfPlant />}
              {decor === "stack" && <ShelfBookStack />}
            </>
          )}
        </div>

        {/* The plank sits below the books rather than in front of them: seen
            straight on, you get the lit top face, then the darker front edge,
            then the shadow it throws on the wall. */}
        <div aria-hidden className="pointer-events-none">
          <div
            className="h-1.5 rounded-t-[3px]"
            style={{
              backgroundColor: "var(--shelf-wood-lit)",
              // Where the books meet the wood.
              boxShadow: "inset 0 2px 3px -2px var(--shelf-contact)",
            }}
          />
          <div
            className="h-3 rounded-b-[3px]"
            style={{
              // Darkening towards the bottom rounds the front edge off; a flat
              // fill reads as a coloured bar rather than a board.
              backgroundImage:
                "linear-gradient(to bottom, var(--shelf-wood), var(--shelf-wood-edge))",
              boxShadow: "0 7px 14px -8px var(--shelf-contact)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

/** A book resting on its side at the end of a full row. */
function LyingBook({
  book,
  shelf,
}: {
  book: ShelfBook;
  shelf: ShelfValue;
}) {
  const colour = spineColour(book.title);

  return (
    <Link
      href={`/books?shelf=${shelf}`}
      title={`${book.title} — ${book.author}`}
      className="block w-24 rounded-[3px] px-2 py-1 text-[10px] leading-tight font-medium transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
      style={{ backgroundColor: colour, color: "var(--spine-ink)" }}
    >
      <span className="block truncate">{book.title}</span>
    </Link>
  );
}
