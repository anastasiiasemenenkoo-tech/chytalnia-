"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BookCover } from "@/components/books/book-cover";
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

export function BookShelfRow({
  shelf,
  label,
  books,
}: {
  shelf: ShelfValue;
  label: string;
  books: ShelfBook[];
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
            className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label={dict.books.scrollRight}
            className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30 transition-colors"
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
            "relative flex items-end gap-4 overflow-x-auto scroll-smooth px-2 pt-2",
            // The plank is the visual edge of this row, so the native
            // scrollbar would only cut across it.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {books.length === 0 ? (
            <p className="text-muted-foreground flex h-[168px] items-end pb-2 text-sm">
              {dict.books.shelfEmpty}
            </p>
          ) : (
            books.map((book) => (
              <Link
                key={book.id}
                href={`/books?shelf=${shelf}`}
                title={`${book.title} — ${book.author}`}
                className="group w-28 shrink-0"
              >
                <BookCover
                  src={book.coverUrl}
                  alt={book.title}
                  className="shadow-md transition-transform duration-200 group-hover:-translate-y-1"
                />
              </Link>
            ))
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
