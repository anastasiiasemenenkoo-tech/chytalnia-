"use server";

import { revalidatePath } from "next/cache";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { ClubCommentSchema, DeleteClubCommentSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/books";

export async function postClubComment(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = ClubCommentSchema.safeParse({
    clubId: formData.get("clubId"),
    body: formData.get("body"),
    parentId: formData.get("parentId") ?? "",
  });
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    return { ok: false, error: issues.body?.[0] ?? dict.clubs.invalid };
  }

  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: { userId: user.id, clubId: parsed.data.clubId },
    },
  });
  if (!membership) return { ok: false, error: dict.clubs.mustJoinToComment };

  const parentId = parsed.data.parentId || null;
  if (parentId) {
    const parent = await prisma.clubComment.findUnique({
      where: { id: parentId },
      select: { clubId: true, parentId: true },
    });
    if (!parent || parent.clubId !== parsed.data.clubId || parent.parentId !== null) {
      return { ok: false, error: dict.clubs.commentNotFound };
    }
  }

  await prisma.clubComment.create({
    data: {
      clubId: parsed.data.clubId,
      authorId: user.id,
      parentId,
      body: parsed.data.body,
    },
  });

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}

export async function deleteClubComment(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = DeleteClubCommentSchema.safeParse({
    clubId: formData.get("clubId"),
    commentId: formData.get("commentId"),
  });
  if (!parsed.success) return { ok: false, error: dict.clubs.invalid };

  const comment = await prisma.clubComment.findUnique({
    where: { id: parsed.data.commentId },
    select: { authorId: true, clubId: true, club: { select: { ownerId: true } } },
  });
  if (!comment || comment.clubId !== parsed.data.clubId) {
    return { ok: false, error: dict.clubs.commentNotFound };
  }
  if (comment.authorId !== user.id && comment.club.ownerId !== user.id) {
    return { ok: false, error: dict.clubs.commentDeleteDenied };
  }

  await prisma.clubComment.delete({ where: { id: parsed.data.commentId } });

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  return { ok: true };
}
