"use client";

import { createContext, useContext } from "react";

import type { Dictionary } from "@/i18n/dictionaries/uk";
import { interpolate } from "@/i18n/interpolate";

type Ctx = { dict: Dictionary; locale: "uk" | "en" };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  dict,
  locale,
  children,
}: {
  dict: Dictionary;
  locale: "uk" | "en";
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ dict, locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useDict(): Dictionary {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useDict must be used within an I18nProvider");
  }
  return ctx.dict;
}

export function useLocale(): "uk" | "en" {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useLocale must be used within an I18nProvider");
  }
  return ctx.locale;
}

export { interpolate };
