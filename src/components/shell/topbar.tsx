import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { AccountMenu } from "@/components/shell/account-menu";
import { LanguageToggle } from "@/components/shell/language-toggle";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";

function initials(input: string | null | undefined, fallback: string) {
  const src = (input ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function Topbar({
  user,
}: {
  user: { id: string; email: string; name: string | null };
}) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <header className="bg-background flex h-14 items-center justify-between gap-3 border-b px-4 md:px-6">
      {/* min-w-0 + truncate: without them a long name pushes the controls off
          a phone-width screen and wraps the greeting past the header's h-14. */}
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        <div className="text-muted-foreground truncate text-sm">
          {user.name
            ? interpolate(dict.topbar.welcomeBack, { name: user.name })
            : dict.topbar.welcomeBackNoName}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LanguageToggle locale={locale} />
        <ThemeToggle />
        <AccountMenu
          userId={user.id}
          initials={initials(user.name, user.email)}
        />
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            {/* On a phone the word alone costs more width than the whole row
                has to spare, so the icon carries it and the label stays for
                screen readers. */}
            <span className="sr-only sm:not-sr-only">{dict.topbar.signOut}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
