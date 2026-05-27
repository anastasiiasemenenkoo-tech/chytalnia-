"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import {
  LoginSchema,
  SignupSchema,
  YearlyGoalSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/actions/books";

export type AuthFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
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
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
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
      return { errors: { _form: ["Could not sign you in. Please log in."] } };
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
      return { errors: { _form: ["Invalid email or password."] } };
    }
    throw error;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function setYearlyGoal(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = YearlyGoalSchema.safeParse({
    target: formData.get("target"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Goal must be between 0 and 1000." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { yearlyGoal: parsed.data.target > 0 ? parsed.data.target : null },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
