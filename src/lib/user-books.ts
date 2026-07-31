import { settleDuelsForFinishedBook } from "@/actions/duels";
import { prisma } from "@/lib/db";
import type { ShelfValue } from "@/lib/validators";

/**
 * Put a book on someone's shelf, moving it if it is already there.
 *
 * Deliberately not in a `"use server"` module: every export of one of those
 * becomes a callable endpoint, and this takes a `userId` it does not check.
 */
export async function upsertUserBook(args: {
  userId: string;
  bookId: string;
  shelf: ShelfValue;
}) {
  const finishedAt = args.shelf === "READ" ? new Date() : null;
  const userBook = await prisma.userBook.upsert({
    where: { userId_bookId: { userId: args.userId, bookId: args.bookId } },
    update: { shelf: args.shelf, finishedAt },
    create: {
      userId: args.userId,
      bookId: args.bookId,
      shelf: args.shelf,
      finishedAt,
    },
  });
  if (args.shelf === "READ") {
    await settleDuelsForFinishedBook(args.userId, args.bookId);
  }
  return userBook;
}
