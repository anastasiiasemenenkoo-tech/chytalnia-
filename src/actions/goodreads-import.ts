"use server";

import Papa from "papaparse";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ShelfValue } from "@/lib/validators";

type GoodreadsRow = {
  "Book Id"?: string;
  Title?: string;
  Author?: string;
  ISBN?: string;
  ISBN13?: string;
  "My Rating"?: string;
  "Date Read"?: string;
  "Date Added"?: string;
  "Exclusive Shelf"?: string;
  "My Review"?: string;
  "Private Notes"?: string;
};

const SHELF_MAP: Record<string, ShelfValue> = {
  read: "READ",
  "currently-reading": "READING",
  "to-read": "WANT_TO_READ",
};

export type GoodreadsImportState =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string }
  | undefined;

// Goodreads wraps ISBN cells like ="9781234567890" so Excel treats them as
// text rather than numbers — strip that down to the digits (and trailing X
// for ISBN-10 check digits).
function cleanIsbn(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d{9,13}X?)/);
  return match ? match[1] : null;
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function fetchCoverByIsbn(isbn: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      { headers: { "User-Agent": "reader-dashboard (learning project)" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<
      string,
      { cover?: { medium?: string; large?: string } }
    >;
    const entry = data[`ISBN:${isbn}`];
    return entry?.cover?.medium ?? entry?.cover?.large ?? null;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

export async function importGoodreadsCsv(
  _prev: GoodreadsImportState,
  formData: FormData,
): Promise<GoodreadsImportState> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: dict.books.importNoFile };
  }

  const text = await file.text();
  const parsed = Papa.parse<GoodreadsRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data.filter((r) => r.Title && r["Exclusive Shelf"]);
  if (rows.length === 0) {
    return { ok: false, error: dict.books.importEmpty };
  }

  const isbns = rows.map((r) => cleanIsbn(r.ISBN13) ?? cleanIsbn(r.ISBN));
  const covers = await mapWithConcurrency(isbns, 5, (isbn) =>
    isbn ? fetchCoverByIsbn(isbn) : Promise.resolve(null),
  );

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const shelf = SHELF_MAP[row["Exclusive Shelf"]?.trim().toLowerCase() ?? ""];
    if (!shelf || !row["Book Id"]) {
      skipped++;
      continue;
    }

    const olid = `goodreads:${row["Book Id"]}`;
    const dateAdded = parseDate(row["Date Added"]);
    const dateRead = parseDate(row["Date Read"]);
    const ratingNum = Number(row["My Rating"]) || 0;
    const review = row["My Review"]?.trim() || null;
    const notes = row["Private Notes"]?.trim() || null;
    const coverUrl = covers[i];

    const book = await prisma.book.upsert({
      where: { olid },
      update: {
        title: row.Title!,
        author: row.Author || "Unknown",
        ...(coverUrl ? { coverUrl } : {}),
      },
      create: {
        olid,
        title: row.Title!,
        author: row.Author || "Unknown",
        coverUrl,
      },
    });

    const finishedAt = shelf === "READ" ? (dateRead ?? dateAdded) : null;
    const ratedAt = ratingNum > 0 ? (dateRead ?? dateAdded ?? new Date()) : null;
    const reviewUpdatedAt = review ? (dateRead ?? dateAdded ?? new Date()) : null;
    const notesUpdatedAt = notes ? new Date() : null;

    await prisma.userBook.upsert({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      update: {
        shelf,
        finishedAt,
        rating: ratingNum > 0 ? ratingNum : null,
        ratedAt,
        review,
        reviewUpdatedAt,
        notes,
        notesUpdatedAt,
      },
      create: {
        userId: user.id,
        bookId: book.id,
        shelf,
        addedAt: dateAdded ?? new Date(),
        finishedAt,
        rating: ratingNum > 0 ? ratingNum : null,
        ratedAt,
        review,
        reviewUpdatedAt,
        notes,
        notesUpdatedAt,
      },
    });

    imported++;
  }

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true, imported, skipped };
}
