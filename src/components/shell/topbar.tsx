import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { LanguageToggle } from "@/components/shell/language-toggle";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  user: { email: string; name: string | null };
}) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <header className="bg-background flex h-14 items-center justify-between gap-3 border-b px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <div className="text-muted-foreground text-sm">
          {user.name
            ? interpolate(dict.topbar.welcomeBack, { name: user.name })
            : dict.topbar.welcomeBackNoName}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle locale={locale} />
        <ThemeToggle />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {initials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {dict.topbar.signOut}
          </Button>
        </form>
      </div>
    </header>
  );
}
