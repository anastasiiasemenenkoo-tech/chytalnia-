"use server";

import { revalidatePath } from "next/cache";

import { signOut } from "@/auth";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { requireCurrentUser } from "@/lib/session";
import { createToken, hashToken, TOKEN_TTL_MS } from "@/lib/tokens";
import {
  ConfirmEmailChangeSchema,
  DeleteAccountSchema,
  UpdateProfileSchema,
} from "@/lib/validators";

import type { ActionResult } from "@/actions/books";

type ValidationKey = keyof Awaited<
  ReturnType<typeof getDictionary>
>["auth"]["validation"];

export type UpdateProfileResult =
  | { ok: true; pendingEmail?: string }
  | { ok: false; error: string };

export async function updateProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
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

  const newEmail = parsed.data.email;
  const emailChanged = newEmail !== user.email.toLowerCase();

  if (emailChanged) {
    const taken = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });
    if (taken) return { ok: false, error: dict.account.emailTaken };
  }

  // The name is the harmless half and saves outright. The address is the
  // login identity, so it goes nowhere near `User` until the letter below
  // is answered — a typo would otherwise take sign-in and password reset
  // with it.
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  if (!emailChanged) {
    await prisma.emailChangeToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    revalidateProfile(user.id);
    return { ok: true };
  }

  // Only one change can be in flight; asking again replaces the last link.
  await prisma.emailChangeToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const token = createToken();
  await prisma.emailChangeToken.create({
    data: {
      userId: user.id,
      newEmail,
      tokenHash: token.hash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const confirmUrl = `${baseUrl}/confirm-email?token=${token.raw}`;

  try {
    await sendEmail({
      to: newEmail,
      subject: dict.account.changeEmailSubject,
      html: `<p>${dict.account.changeEmailHeading}</p><p><a href="${confirmUrl}">${dict.account.changeEmailCta}</a></p><p style="color:#888;font-size:12px">${dict.account.changeEmailIgnore}</p>`,
    });
  } catch (err) {
    console.error("Failed to send email-change confirmation:", err);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Email change confirmation link: ${confirmUrl}`);
      return { ok: true, pendingEmail: newEmail };
    }
    // Nothing was changed yet, so an undeliverable address is still fixable —
    // say so rather than leaving a pending change nobody can confirm.
    await prisma.emailChangeToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    revalidateProfile(user.id);
    return { ok: false, error: dict.account.emailSendFailed };
  }

  // The old address gets told, so a change nobody at that mailbox asked for
  // is visible while it can still be undone.
  try {
    await sendEmail({
      to: user.email,
      subject: dict.account.changeEmailNoticeSubject,
      html: `<p>${interpolate(dict.account.changeEmailNoticeBody, { email: newEmail })}</p>`,
    });
  } catch (err) {
    console.error("Failed to notify the old address of an email change:", err);
  }

  revalidateProfile(user.id);
  return { ok: true, pendingEmail: newEmail };
}

function revalidateProfile(userId: string) {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/readers/${userId}`);
}

export async function cancelEmailChange(): Promise<ActionResult> {
  const user = await requireCurrentUser();
  await prisma.emailChangeToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export type ConfirmEmailChangeState =
  | { ok?: true; email?: string; error?: string }
  | undefined;

/**
 * Deliberately open to signed-out callers: the link is answered from whatever
 * device opened the mailbox, and the token — proof that someone reads mail at
 * the new address — is the whole authorisation.
 */
export async function confirmEmailChangeAction(
  _prev: ConfirmEmailChangeState,
  formData: FormData,
): Promise<ConfirmEmailChangeState> {
  const dict = await getDictionary();
  const parsed = ConfirmEmailChangeSchema.safeParse({
    token: formData.get("token"),
  });
  if (!parsed.success) return { error: dict.account.confirmInvalid };

  const token = await prisma.emailChangeToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });

  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return { error: dict.account.confirmInvalid };
  }

  const taken = await prisma.user.findFirst({
    where: { email: token.newEmail, id: { not: token.userId } },
    select: { id: true },
  });
  if (taken) return { error: dict.account.emailTaken };

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: token.userId },
        data: { email: token.newEmail },
      }),
      prisma.emailChangeToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.emailChangeToken.deleteMany({
        where: { userId: token.userId, usedAt: null },
      }),
      // Reset links already sitting in the old mailbox would otherwise still
      // open the account after it moved.
      prisma.passwordResetToken.deleteMany({
        where: { userId: token.userId, usedAt: null },
      }),
    ]);
  } catch (err) {
    // The address could have been claimed between the check above and here.
    console.error("Failed to apply an email change:", err);
    return { error: dict.account.emailTaken };
  }

  revalidateProfile(token.userId);
  return { ok: true, email: token.newEmail };
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
