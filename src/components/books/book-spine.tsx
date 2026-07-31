"use client";

import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import type { ShelfValue } from "@/lib/validators";

/** Tallest a spine can get; the row reserves exactly this much height. */
export const SPINE_MAX_HEIGHT = 168;

const SPINE_COLOURS = 10;

/**
 * Stable per-title hash. Two books never swap colours between renders or
 * between server and client, which a random pick would.
 *
 * FNV-1a rather than the usual `hash * 31 + c`: that one barely mixes the
 * low bits, and a shelf of similar Ukrainian titles came out four shades of
 * the same olive.
 */
function hashTitle(title: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < title.length; i++) {
    hash ^= title.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Shared with the lying-flat books so a title keeps its colour there too. */
export function spineColour(title: string) {
  return `var(--spine-${(hashTitle(title) % SPINE_COLOURS) + 1})`;
}

/**
 * Real shelves are uneven, so width and height come off the same hash —
 * a fat hardback stays fat every time you open the page.
 */
function spineShape(title: string) {
  const hash = hashTitle(title);
  return {
    colour: spineColour(title),
    width: 30 + ((hash >>> 8) % 5) * 5, // 30–50px
    height: SPINE_MAX_HEIGHT - ((hash >>> 16) % 5) * 11, // 124–168px
  };
}

export function BookSpine({
  title,
  author,
  coverUrl,
  shelf,
}: {
  title: string;
  author: string;
  coverUrl: string | null;
  shelf: ShelfValue;
}) {
  const { colour, width, height } = spineShape(title);

  return (
    <Link
      href={`/books?shelf=${shelf}`}
      title={`${title} — ${author}`}
      className="group/spine relative shrink-0 self-end rounded-t-[3px] outline-none"
      style={{ width, height }}
    >
      <span
        className="flex h-full w-full flex-col items-center justify-between rounded-t-[3px] py-2 transition-transform duration-200 group-hover/spine:-translate-y-1.5 group-focus-visible/spine:-translate-y-1.5"
        style={{ backgroundColor: colour }}
      >
        <span
          aria-hidden
          className="h-px w-3/5"
          style={{ backgroundColor: "var(--spine-band)" }}
        />
        <span
          className="flex min-h-0 flex-1 items-center overflow-hidden py-1.5 text-[11px] leading-tight font-medium"
          style={{
            color: "var(--spine-ink)",
            // Vertical-rl alone reads top-down; the flip makes the title climb
            // the spine the way it does on a real shelf.
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          <span className="truncate">{title}</span>
        </span>
        <span
          aria-hidden
          className="h-px w-3/5"
          style={{ backgroundColor: "var(--spine-band)" }}
        />
      </span>

      {/* The cover slides out in front of its neighbours on hover or keyboard
          focus, so nothing is lost by showing spines by default. */}
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 z-20 w-24 -translate-x-1/2 scale-95 opacity-0 transition duration-200 group-hover/spine:scale-100 group-hover/spine:opacity-100 group-focus-visible/spine:scale-100 group-focus-visible/spine:opacity-100"
        style={{ filter: "drop-shadow(0 8px 16px var(--shelf-contact))" }}
      >
        <BookCover src={coverUrl} alt={title} className="border-0" />
      </span>
    </Link>
  );
}
