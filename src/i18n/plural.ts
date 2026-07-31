import { interpolate } from "@/i18n/interpolate";

export type PluralForms = {
  one: string;
  few: string;
  many: string;
  other: string;
};

/**
 * Pick the right plural form for a count and fill in `{count}`.
 *
 * Ukrainian needs three forms (1 книга / 2 книги / 5 книг), English two,
 * so the dictionaries carry all four Intl.PluralRules categories and this
 * picks whichever the locale actually asks for.
 *
 * Takes the locale as an argument rather than reading it, so it works in
 * client components too.
 */
export function plural(
  forms: PluralForms,
  count: number,
  locale: "uk" | "en",
) {
  const rule = new Intl.PluralRules(locale === "uk" ? "uk-UA" : "en-US").select(
    count,
  );
  const form = forms[rule as keyof PluralForms] ?? forms.other;
  return interpolate(form, { count });
}
