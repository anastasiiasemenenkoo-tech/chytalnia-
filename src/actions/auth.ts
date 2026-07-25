"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/auth";
import { getDictionary } from "@/i18n";
import { sendEmail } from "@/lib/mailer";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import {
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  SignupSchema,
  YearlyGoalSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/actions/books";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export type AuthFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
        passwordConfirm?: string[];
        name?: string[];
        _form?: string[];
      };
    }
  | undefined;

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, name, password } = parsed.data;

  const dict = await getDictionary();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: [dict.auth.emailTaken] } };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, hashedPassword } });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { errors: { _form: [dict.auth.couldNotSignIn] } };
    }
    throw error;
  }
  return undefined;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const dict = await getDictionary();
      return { errors: { _form: [dict.auth.invalidCreds] } };
    }
    throw error;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export type ForgotPasswordState =
  | { errors?: { email?: string[] }; sent?: boolean }
  | undefined;

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = RequestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const dict = await getDictionary();
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Only actually create a token / send an email if the account exists, but
  // always report success below — never reveal whether an email is registered.
  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: dict.auth.resetEmailSubject,
        html: `<p>${dict.auth.resetEmailHeading}</p><p><a href="${resetUrl}">${dict.auth.resetEmailCta}</a></p><p style="color:#888;font-size:12px">${dict.auth.resetEmailIgnore}</p>`,
      });
    } catch (err) {
      // Email delivery isn't configured everywhere yet (RESEND_API_KEY) —
      // the token still exists in the DB, so don't fail the request over it.
      console.error("Failed to send password reset email:", err);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] Password reset link: ${resetUrl}`);
      }
    }
  }

  return { sent: true };
}

export type ResetPasswordState =
  | {
      errors?: {
        password?: string[];
        passwordConfirm?: string[];
        _form?: string[];
      };
    }
  | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const dict = await getDictionary();
  const tokenHash = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { errors: { _form: [dict.auth.resetInvalidToken] } };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}

export async function setYearlyGoal(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = YearlyGoalSchema.safeParse({
    target: formData.get("target"),
  });
  if (!parsed.success) {
    const dict = await getDictionary();
    return { ok: false, error: dict.goal.invalid };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { yearlyGoal: parsed.data.target > 0 ? parsed.data.target : null },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
