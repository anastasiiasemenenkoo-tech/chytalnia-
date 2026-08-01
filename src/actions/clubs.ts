"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { upsertUserBook } from "@/lib/user-books";
import {
  AddClubBookSchema,
  ClubIdSchema,
  ClubMemberSchema,
  ClubScheduleSchema,
  CreateClubSchema,
  EditClubSchema,
  SetClubBookSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/actions/books";

export type CreateClubState =
  | { errors?: { name?: string[]; description?: string[]; _form?: string[] } }
  | undefined;

export async function createClubAction(
  _prev: CreateClubState,
  formData: FormData,
): Promise<CreateClubState> {
  const user = await requireCurrentUser();
  const parsed = CreateClubSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const club = await prisma.$transaction(async (tx) => {
    const created = await tx.bookClub.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        ownerId: user.id,
      },
    });
    await tx.clubMembership.create({
      data: { clubId: created.id, userId: user.id, role: "OWNER" },
    });
    return created;
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function joinClub(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = ClubIdSchema.safeParse({ clubId: formData.get("clubId") });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.clubs.invalid }; }

  await prisma.clubMembership.upsert({
    where: {
      userId_clubId: { userId: user.id, clubId: parsed.data.clubId },
    },
    update: {},
    create: {
      userId: user.id,
      clubId: parsed.data.clubId,
      role: "MEMBER",
    },
  });

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}

export async function leaveClub(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = ClubIdSchema.safeParse({ clubId: formData.get("clubId") });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.clubs.invalid }; }

  const membership = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: parsed.data.clubId } },
  });
  if (!membership) { const dict = await getDictionary(); return { ok: false, error: dict.clubs.notMember }; }
  if (membership.role === "OWNER") {
    { const dict = await getDictionary(); return { ok: false, error: dict.clubs.ownerCannotLeave }; }
  }

  await prisma.clubMembership.delete({ where: { id: membership.id } });

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}

export async function setClubCurrentBook(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = SetClubBookSchema.safeParse({
    clubId: formData.get("clubId"),
    bookId: formData.get("bookId"),
  });
  if (!parsed.success) { const dict = await getDictionary(); return { ok: false, error: dict.clubs.invalid }; }

  const club = await prisma.bookClub.findUnique({
    where: { id: parsed.data.clubId },
    select: { ownerId: true },
  });
  if (!club || club.ownerId !== user.id) {
    { const dict = await getDictionary(); return { ok: false, error: dict.clubs.setOnlyOwner }; }
  }

  await applyCurrentBook(parsed.data.clubId, parsed.data.bookId);

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}

/**
 * Point the club at a book and keep its reading history honest: the previous
 * read is closed off, and re-picking the same book is a no-op rather than a
 * second history entry. Assumes the caller has already checked ownership.
 */
async function applyCurrentBook(clubId: string, bookId: string) {
  await prisma.$transaction(async (tx) => {
    const openHistory = await tx.clubReadingHistory.findFirst({
      where: { clubId, endedAt: null },
    });
    if (openHistory && openHistory.bookId !== bookId) {
      await tx.clubReadingHistory.update({
        where: { id: openHistory.id },
        data: { endedAt: new Date() },
      });
    }
    if (!openHistory || openHistory.bookId !== bookId) {
      await tx.clubReadingHistory.create({ data: { clubId, bookId } });
    }
    await tx.bookClub.update({
      where: { id: clubId },
      data: { currentlyReadingBookId: bookId },
    });
  });
}

/**
 * Add a book the owner does not have yet and hand it to the club in one go,
 * so picking the club's next read doesn't start with a trip to your shelves.
 */
export async function addBookForClub(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = AddClubBookSchema.safeParse({
    clubId: formData.get("clubId"),
    olid: formData.get("olid"),
    title: formData.get("title"),
    author: formData.get("author"),
    coverUrl: formData.get("coverUrl") ?? "",
  });
  if (!parsed.success) return { ok: false, error: dict.books.invalidData };

  const club = await prisma.bookClub.findUnique({
    where: { id: parsed.data.clubId },
    select: { ownerId: true },
  });
  if (!club || club.ownerId !== user.id) {
    return { ok: false, error: dict.clubs.setOnlyOwner };
  }

  // Upsert, not create: the same Open Library work may already be on
  // somebody's shelf, and `olid` is unique.
  const book = await prisma.book.upsert({
    where: { olid: parsed.data.olid },
    update: {
      title: parsed.data.title,
      author: parsed.data.author,
      coverUrl: parsed.data.coverUrl || null,
    },
    create: {
      olid: parsed.data.olid,
      title: parsed.data.title,
      author: parsed.data.author,
      coverUrl: parsed.data.coverUrl || null,
    },
  });

  // The club is about to read it, so READING is the shelf that matches
  // reality — the owner shouldn't have to move it there afterwards.
  await upsertUserBook({ userId: user.id, bookId: book.id, shelf: "READING" });
  await applyCurrentBook(parsed.data.clubId, book.id);

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Ownership gate shared by every owner-only club action below. */
async function requireClubOwner(clubId: string, userId: string) {
  const club = await prisma.bookClub.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });
  return !!club && club.ownerId === userId;
}

export async function editClub(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = EditClubSchema.safeParse({
    clubId: formData.get("clubId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    meetingUrl: formData.get("meetingUrl") ?? "",
  });
  if (!parsed.success) {
    // A bad link and a bad name are different mistakes; say which.
    const fields = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      error: fields.meetingUrl
        ? dict.clubs.meetingUrlInvalid
        : dict.clubs.editInvalid,
    };
  }

  if (!(await requireClubOwner(parsed.data.clubId, user.id))) {
    return { ok: false, error: dict.clubs.ownerOnly };
  }

  await prisma.bookClub.update({
    where: { id: parsed.data.clubId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      meetingUrl: parsed.data.meetingUrl || null,
    },
  });

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}

export async function removeClubMember(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = ClubMemberSchema.safeParse({
    clubId: formData.get("clubId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) return { ok: false, error: dict.clubs.invalid };

  if (!(await requireClubOwner(parsed.data.clubId, user.id))) {
    return { ok: false, error: dict.clubs.ownerOnly };
  }
  // Removing yourself would leave the club with nobody who can run it, and
  // `leaveClub` already refuses the same thing for the same reason.
  if (parsed.data.userId === user.id) {
    return { ok: false, error: dict.clubs.ownerCannotLeave };
  }

  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: {
        userId: parsed.data.userId,
        clubId: parsed.data.clubId,
      },
    },
    select: { id: true },
  });
  if (!membership) return { ok: false, error: dict.clubs.notMember };

  await prisma.clubMembership.delete({ where: { id: membership.id } });

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}


export async function updateClubSchedule(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = ClubScheduleSchema.safeParse({
    clubId: formData.get("clubId"),
    startDate: formData.get("startDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    return { ok: false, error: issues.dueDate?.[0] ?? dict.clubs.invalidDates };
  }

  const club = await prisma.bookClub.findUnique({
    where: { id: parsed.data.clubId },
    select: { ownerId: true, currentlyReadingBookId: true },
  });
  if (!club || club.ownerId !== user.id) {
    return { ok: false, error: dict.clubs.setOnlyOwner };
  }
  if (!club.currentlyReadingBookId) {
    return { ok: false, error: dict.clubs.noCurrentBook };
  }

  const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const openHistory = await prisma.clubReadingHistory.findFirst({
    where: { clubId: parsed.data.clubId, endedAt: null },
  });

  if (openHistory) {
    await prisma.clubReadingHistory.update({
      where: { id: openHistory.id },
      data: { startDate, dueDate },
    });
  } else {
    await prisma.clubReadingHistory.create({
      data: {
        clubId: parsed.data.clubId,
        bookId: club.currentlyReadingBookId,
        startDate,
        dueDate,
      },
    });
  }

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}
