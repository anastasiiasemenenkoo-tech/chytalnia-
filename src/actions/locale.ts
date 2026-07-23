"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n";

export async function setLocaleAction(next: string) {
  const safe: Locale = LOCALES.includes(next as Locale)
    ? (next as Locale)
    : "uk";

  const store = await cookies();
  store.set(LOCALE_COOKIE, safe, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // one year
    sameSite: "lax",
  });

  // Force every cached server render to recompute with the new locale.
  revalidatePath("/", "layout");
}
