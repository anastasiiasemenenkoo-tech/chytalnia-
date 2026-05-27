"use client";

import { useTransition } from "react";

import { setLocaleAction } from "@/actions/locale";
import { cn } from "@/lib/utils";

const LABELS: Record<"uk" | "en", string> = {
  uk: "UK",
  en: "EN",
};

export function LanguageToggle({ locale }: { locale: "uk" | "en" }) {
  const [pending, startTransition] = useTransition();

  function pick(next: "uk" | "en") {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="border-input bg-background inline-flex h-8 items-center rounded-md border p-0.5 text-xs font-medium"
    >
      {(["uk", "en"] as const).map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => pick(code)}
            disabled={pending}
            aria-pressed={active}
            className={cn(
              "h-7 rounded-sm px-2 transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
