"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { settleDuelsForFinishedBook } from "@/actions/duels";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { upsertUserBook } from "@/lib/user-books";
import {
  AddBookSchema,
  ClearRatingSchema,
  ManualAddBookSchema,
  MoveBookSchema,
  NotesSchema,
  RatingSchema,
  RemoveBookSchema,
  ReviewSchema,
  UpdateProgressSchema,
} from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addBookToShelf(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = AddBookSchema.safeParse({
    olid: formData.get("olid"),
    title: formData.get("title"),
    author: formData.get("author"),
    coverUrl: formData.get("coverUrl") ?? "",
    shelf: formData.get("shelf"),
  });
  if (!parsed.success) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.invalidData }; }
  }

  const { olid, title, author, coverUrl, shelf } = parsed.data;

  const book = await prisma.book.upsert({
    where: { olid },
    update: { title, author, coverUrl: coverUrl || null },
    create: { olid, title, author, coverUrl: coverUrl || null },
  });

  await upsertUserBook({ userId: user.id, bookId: book.id, shelf });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function manualAddBook(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = ManualAddBookSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    shelf: formData.get("shelf"),
  });
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const first =
      issues.title?.[0] ?? issues.author?.[0] ?? issues.shelf?.[0] ?? "Invalid input.";
    return { ok: false, error: first };
  }

  const { title, author, shelf } = parsed.data;
  const olid = `manual:${randomUUID()}`;

  const book = await prisma.book.create({
    data: { olid, title, author },
  });

  await upsertUserBook({ userId: user.id, bookId: book.id, shelf });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function moveBookToShelf(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = MoveBookSchema.safeParse({
    userBookId: formData.get("userBookId"),
    shelf: formData.get("shelf"),
  });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.books.invalidData }; }

  const existing = await prisma.userBook.findUnique({
    where: { id: parsed.data.userBookId },
    select: { userId: true, bookId: true },
  });
  if (!existing || existing.userId !== user.id) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  const finishedAt = parsed.data.shelf === "READ" ? new Date() : null;
  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: { shelf: parsed.data.shelf, finishedAt },
  });

  if (parsed.data.shelf === "READ") {
    await settleDuelsForFinishedBook(user.id, existing.bookId);
  }

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeBookFromShelf(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = RemoveBookSchema.safeParse({
    userBookId: formData.get("userBookId"),
  });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.books.invalidData }; }

  const existing = await prisma.userBook.findUnique({
    where: { id: parsed.data.userBookId },
    select: { userId: true },
  });
  if (!existing || existing.userId !== user.id) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  await prisma.userBook.delete({ where: { id: parsed.data.userBookId } });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateReadingProgress(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = UpdateProgressSchema.safeParse({
    userBookId: formData.get("userBookId"),
    pagesRead: formData.get("pagesRead"),
    totalPages: formData.get("totalPages"),
  });
  if (!parsed.success) {
    const issues = parsed.error.flatten();
    const first =
      issues.fieldErrors.pagesRead?.[0] ??
      issues.fieldErrors.totalPages?.[0] ??
      issues.formErrors[0] ??
      "Invalid progress values.";
    return { ok: false, error: first };
  }

  const existing = await prisma.userBook.findUnique({
    where: { id: parsed.data.userBookId },
    select: { userId: true, shelf: true, bookId: true },
  });
  if (!existing || existing.userId !== user.id) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  const finished = parsed.data.pagesRead >= parsed.data.totalPages;

  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: {
      pagesRead: parsed.data.pagesRead,
      totalPages: parsed.data.totalPages,
      progressUpdated: new Date(),
      // Auto-promote to READ when finished; never auto-demote.
      ...(finished && existing.shelf !== "READ"
        ? { shelf: "READ", finishedAt: new Date() }
        : {}),
    },
  });

  if (finished && existing.shelf !== "READ") {
    await settleDuelsForFinishedBook(user.id, existing.bookId);
  }

  revalidatePath("/books");
  revalidatePath("/dashboard");
  // Club page may surface this user's progress for the currently-reading book.
  revalidatePath("/clubs", "layout");
  return { ok: true };
}

/**
 * Ownership check helper — every book-action mutation needs to confirm
 * the UserBook row belongs to the calling user before touching it.
 */
async function assertOwnsUserBook(userBookId: string, userId: string) {
  const row = await prisma.userBook.findUnique({
    where: { id: userBookId },
    select: { userId: true },
  });
  if (!row || row.userId !== userId) return false;
  return true;
}

export async function setRating(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = RatingSchema.safeParse({
    userBookId: formData.get("userBookId"),
    rating: formData.get("rating"),
  });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.books.invalidData }; }

  if (!(await assertOwnsUserBook(parsed.data.userBookId, user.id))) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: { rating: parsed.data.rating, ratedAt: new Date() },
  });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  revalidatePath("/clubs", "layout");
  return { ok: true };
}

export async function clearRating(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = ClearRatingSchema.safeParse({
    userBookId: formData.get("userBookId"),
  });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.books.invalidData }; }

  if (!(await assertOwnsUserBook(parsed.data.userBookId, user.id))) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: { rating: null, ratedAt: null },
  });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  revalidatePath("/clubs", "layout");
  return { ok: true };
}

export async function updateReviewAndRating(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = ReviewSchema.safeParse({
    userBookId: formData.get("userBookId"),
    rating: formData.get("rating"),
    review: formData.get("review") ?? "",
  });
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const first =
      issues.rating?.[0] ?? issues.review?.[0] ?? "Invalid review.";
    return { ok: false, error: first };
  }

  if (!(await assertOwnsUserBook(parsed.data.userBookId, user.id))) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  const reviewText = parsed.data.review?.trim() || null;
  const now = new Date();

  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: {
      rating: parsed.data.rating,
      ratedAt: now,
      review: reviewText,
      reviewUpdatedAt: reviewText ? now : null,
    },
  });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  revalidatePath("/clubs", "layout");
  return { ok: true };
}

export async function updateNotes(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = NotesSchema.safeParse({
    userBookId: formData.get("userBookId"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().fieldErrors.notes?.[0] ?? "Invalid notes.",
    };
  }

  if (!(await assertOwnsUserBook(parsed.data.userBookId, user.id))) {
    { const dict = await getDictionary(); return { ok: false, error: dict.books.notFound }; }
  }

  const notesText = parsed.data.notes?.trim() || null;
  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: {
      notes: notesText,
      notesUpdatedAt: notesText ? new Date() : null,
    },
  });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}
