"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import {
  AddBookSchema,
  ManualAddBookSchema,
  MoveBookSchema,
  RemoveBookSchema,
  type ShelfValue,
} from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function upsertUserBook(args: {
  userId: string;
  bookId: string;
  shelf: ShelfValue;
}) {
  const finishedAt = args.shelf === "READ" ? new Date() : null;
  return prisma.userBook.upsert({
    where: { userId_bookId: { userId: args.userId, bookId: args.bookId } },
    update: { shelf: args.shelf, finishedAt },
    create: {
      userId: args.userId,
      bookId: args.bookId,
      shelf: args.shelf,
      finishedAt,
    },
  });
}

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
    return { ok: false, error: "Invalid book data." };
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
  if (!parsed.success) return { ok: false, error: "Invalid shelf change." };

  const existing = await prisma.userBook.findUnique({
    where: { id: parsed.data.userBookId },
    select: { userId: true },
  });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Book not found." };
  }

  const finishedAt = parsed.data.shelf === "READ" ? new Date() : null;
  await prisma.userBook.update({
    where: { id: parsed.data.userBookId },
    data: { shelf: parsed.data.shelf, finishedAt },
  });

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
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const existing = await prisma.userBook.findUnique({
    where: { id: parsed.data.userBookId },
    select: { userId: true },
  });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Book not found." };
  }

  await prisma.userBook.delete({ where: { id: parsed.data.userBookId } });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}
