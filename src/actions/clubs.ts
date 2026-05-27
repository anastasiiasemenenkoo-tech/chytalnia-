"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import {
  ClubIdSchema,
  CreateClubSchema,
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

  await prisma.bookClub.update({
    where: { id: parsed.data.clubId },
    data: { currentlyReadingBookId: parsed.data.bookId },
  });

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}
