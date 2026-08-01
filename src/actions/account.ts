"use server";

import { revalidatePath } from "next/cache";

import { signOut } from "@/auth";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { DeleteAccountSchema, UpdateProfileSchema } from "@/lib/validators";

import type { ActionResult } from "@/actions/books";

type ValidationKey = keyof Awaited<
  ReturnType<typeof getDictionary>
>["auth"]["validation"];

export async function updateProfile(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    // The schemas emit dictionary keys, same as the auth forms do.
    const first = parsed.error.issues[0]?.message as ValidationKey | undefined;
    return {
      ok: false,
      error:
        (first && dict.auth.validation[first]) ?? dict.account.saveFailed,
    };
  }

  if (parsed.data.email !== user.email) {
    const taken = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (taken) return { ok: false, error: dict.account.emailTaken };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, email: parsed.data.email },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/readers/${user.id}`);
  return { ok: true };
}

export async function deleteAccount(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const parsed = DeleteAccountSchema.safeParse({
    confirm: formData.get("confirm"),
  });
  if (!parsed.success || parsed.data.confirm !== user.email.toLowerCase()) {
    return { ok: false, error: dict.account.deleteMismatch };
  }

  await prisma.$transaction(async (tx) => {
    // `BookClub.owner` is a required relation with no `onDelete`, so Postgres
    // refuses to delete a user who still owns one. A club with other people
    // in it shouldn't die because one of them left, so it changes hands —
    // to whoever has been a member longest. Only an empty one is deleted.
    const ownedClubs = await tx.bookClub.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });

    for (const club of ownedClubs) {
      const heir = await tx.clubMembership.findFirst({
        where: { clubId: club.id, userId: { not: user.id } },
        orderBy: { joinedAt: "asc" },
        select: { id: true, userId: true },
      });

      if (heir) {
        await tx.bookClub.update({
          where: { id: club.id },
          data: { ownerId: heir.userId },
        });
        await tx.clubMembership.update({
          where: { id: heir.id },
          data: { role: "OWNER" },
        });
      } else {
        await tx.bookClub.delete({ where: { id: club.id } });
      }
    }

    // Everything else hanging off the user cascades: shelves, memberships,
    // comments, duels, follows, reset tokens.
    await tx.user.delete({ where: { id: user.id } });
  });

  await signOut({ redirectTo: "/" });
  return { ok: true };
}
