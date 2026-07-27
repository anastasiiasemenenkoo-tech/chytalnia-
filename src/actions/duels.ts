"use server";

import { revalidatePath } from "next/cache";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { ChallengeToDuelSchema, DuelIdSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/books";

/**
 * Called whenever a book lands on the READ shelf. Any active duel on that
 * book involving this reader is settled in their favour.
 *
 * The status filter is what makes this safe when both readers finish at
 * nearly the same moment: the second write matches no rows, so the first
 * one to commit keeps the win instead of being overwritten.
 */
export async function settleDuelsForFinishedBook(
  userId: string,
  bookId: string,
) {
  const { count } = await prisma.readingDuel.updateMany({
    where: {
      bookId,
      status: "ACTIVE",
      OR: [{ challengerId: userId }, { opponentId: userId }],
    },
    data: { status: "FINISHED", winnerId: userId, wonAt: new Date() },
  });
  if (count > 0) revalidatePath("/duels");
  return count;
}

export async function challengeToDuel(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const parsed = ChallengeToDuelSchema.safeParse({
    clubId: formData.get("clubId"),
    opponentId: formData.get("opponentId"),
  });
  if (!parsed.success) return { ok: false, error: dict.clubs.invalid };

  const { clubId, opponentId } = parsed.data;
  if (opponentId === user.id) {
    return { ok: false, error: dict.duels.cannotChallengeSelf };
  }

  const club = await prisma.bookClub.findUnique({
    where: { id: clubId },
    select: {
      currentlyReadingBookId: true,
      memberships: { select: { userId: true } },
    },
  });
  if (!club) return { ok: false, error: dict.clubs.invalid };

  const memberIds = new Set(club.memberships.map((m) => m.userId));
  if (!memberIds.has(user.id)) {
    return { ok: false, error: dict.clubs.notMember };
  }
  if (!memberIds.has(opponentId)) {
    return { ok: false, error: dict.duels.opponentNotMember };
  }
  if (!club.currentlyReadingBookId) {
    return { ok: false, error: dict.duels.noBookToRace };
  }

  const bookId = club.currentlyReadingBookId;

  // One live duel per pair per book, whichever side threw the first challenge.
  const existing = await prisma.readingDuel.findFirst({
    where: {
      bookId,
      status: { in: ["PENDING", "ACTIVE"] },
      OR: [
        { challengerId: user.id, opponentId },
        { challengerId: opponentId, opponentId: user.id },
      ],
    },
    select: { id: true },
  });
  if (existing) return { ok: false, error: dict.duels.alreadyRunning };

  await prisma.readingDuel.create({
    data: { clubId, bookId, challengerId: user.id, opponentId },
  });

  revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/duels");
  return { ok: true };
}

export async function respondToDuel(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const parsed = DuelIdSchema.safeParse({ duelId: formData.get("duelId") });
  if (!parsed.success) return { ok: false, error: dict.duels.notFound };

  const accept = formData.get("accept") === "true";

  const duel = await prisma.readingDuel.findUnique({
    where: { id: parsed.data.duelId },
    select: { opponentId: true, status: true, clubId: true },
  });
  if (!duel) return { ok: false, error: dict.duels.notFound };
  if (duel.opponentId !== user.id) {
    return { ok: false, error: dict.duels.notYoursToAnswer };
  }
  if (duel.status !== "PENDING") {
    return { ok: false, error: dict.duels.alreadyAnswered };
  }

  await prisma.readingDuel.update({
    where: { id: parsed.data.duelId },
    data: {
      status: accept ? "ACTIVE" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  revalidatePath("/duels");
  revalidatePath(`/clubs/${duel.clubId}`);
  return { ok: true };
}

export async function cancelDuel(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const parsed = DuelIdSchema.safeParse({ duelId: formData.get("duelId") });
  if (!parsed.success) return { ok: false, error: dict.duels.notFound };

  const duel = await prisma.readingDuel.findUnique({
    where: { id: parsed.data.duelId },
    select: { challengerId: true, status: true, clubId: true },
  });
  if (!duel) return { ok: false, error: dict.duels.notFound };
  if (duel.challengerId !== user.id) {
    return { ok: false, error: dict.duels.notYoursToCancel };
  }
  if (duel.status !== "PENDING") {
    return { ok: false, error: dict.duels.alreadyAnswered };
  }

  await prisma.readingDuel.update({
    where: { id: parsed.data.duelId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/duels");
  revalidatePath(`/clubs/${duel.clubId}`);
  return { ok: true };
}
