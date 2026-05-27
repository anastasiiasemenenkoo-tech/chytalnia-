import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

import { en } from "@/i18n/dictionaries/en";
import { uk, type Dictionary } from "@/i18n/dictionaries/uk";

export type Locale = "uk" | "en";

export const LOCALES: Locale[] = ["uk", "en"];
export const DEFAULT_LOCALE: Locale = "uk";
export const LOCALE_COOKIE = "lang";

const DICTIONARIES: Record<Locale, Dictionary> = { uk, en };

function parseLocale(value: string | undefined): Locale {
  return value === "en" ? "en" : "uk";
}

/**
 * Server-only locale reader. Cached for the duration of a render so
 * every server component on a page sees a consistent locale.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value);
});

export const getDictionary = cache(async (): Promise<Dictionary> => {
  const locale = await getLocale();
  return DICTIONARIES[locale];
});

export type { Dictionary };
