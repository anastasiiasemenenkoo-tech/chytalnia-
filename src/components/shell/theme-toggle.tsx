"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dict = useDict();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? dict.topbar.lightMode : dict.topbar.darkMode}
    >
      {/* Render both icons to avoid layout shift; hide via opacity once mounted. */}
      <Sun
        className={
          mounted && !isDark
            ? "h-4 w-4"
            : "absolute h-4 w-4 scale-0 opacity-0"
        }
      />
      <Moon
        className={
          mounted && isDark
            ? "h-4 w-4"
            : "absolute h-4 w-4 scale-0 opacity-0"
        }
      />
    </Button>
  );
}
