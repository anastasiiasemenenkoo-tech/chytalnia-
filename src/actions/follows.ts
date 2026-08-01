"use server";

import { revalidatePath } from "next/cache";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { ReaderIdSchema } from "@/lib/validators";

import type { ActionResult } from "@/actions/books";

export async function followReader(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = ReaderIdSchema.safeParse({
    readerId: formData.get("readerId"),
  });
  if (!parsed.success) return { ok: false, error: dict.readers.invalid };

  if (parsed.data.readerId === user.id) {
    return { ok: false, error: dict.readers.cannotFollowSelf };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.readerId },
    select: { id: true },
  });
  if (!target) return { ok: false, error: dict.readers.invalid };

  // Upsert, not create: a double-click shouldn't be an error the reader has
  // to read and dismiss.
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId: target.id,
      },
    },
    update: {},
    create: { followerId: user.id, followingId: target.id },
  });

  revalidatePath("/readers");
  revalidatePath(`/readers/${target.id}`);
  return { ok: true };
}

export async function unfollowReader(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = ReaderIdSchema.safeParse({
    readerId: formData.get("readerId"),
  });
  if (!parsed.success) return { ok: false, error: dict.readers.invalid };

  await prisma.follow.deleteMany({
    where: { followerId: user.id, followingId: parsed.data.readerId },
  });

  revalidatePath("/readers");
  revalidatePath(`/readers/${parsed.data.readerId}`);
  return { ok: true };
}
