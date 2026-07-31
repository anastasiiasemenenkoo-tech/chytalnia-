"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dict = useDict();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Which theme is active is only known in the browser, so the server
          would have to render a placeholder and swap it in after mount. The
          `.dark` class is already on <html> before first paint, so let CSS
          pick the icon — and the label with it, since aria-label cannot be
          switched by a stylesheet. */}
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
      <span className="sr-only dark:hidden">{dict.topbar.darkMode}</span>
      <span className="sr-only hidden dark:inline">
        {dict.topbar.lightMode}
      </span>
    </Button>
  );
}
