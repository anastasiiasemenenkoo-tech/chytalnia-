"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  type LucideIcon,
  Search,
  Swords,
  UserRound,
  Users,
} from "lucide-react";

import { useDict } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey:
    | "overview"
    | "myBooks"
    | "findBooks"
    | "clubs"
    | "readers"
    | "duels";
  icon: LucideIcon;
};

export const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
  { href: "/books", labelKey: "myBooks", icon: Library },
  { href: "/books/search", labelKey: "findBooks", icon: Search },
  { href: "/clubs", labelKey: "clubs", icon: Users },
  { href: "/readers", labelKey: "readers", icon: UserRound },
  { href: "/duels", labelKey: "duels", icon: Swords },
];

/**
 * The most specific item wins. `/books/search` sits under `/books`, so a
 * plain prefix test lit both of them up at once; only the longest matching
 * href counts as active.
 */
function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of NAV) {
    const matches =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const dict = useDict();
  const current = activeHref(pathname);
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground text-sidebar-foreground/80",
            )}
          >
            <Icon className="h-4 w-4" />
            {dict.nav[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  const dict = useDict();
  return (
    <div className="flex h-14 items-center gap-2 border-b px-5">
      <BookOpen className="h-5 w-5" />
      <div className="flex flex-col leading-tight">
        <span className="text-base font-semibold">{dict.brand}</span>
        <span className="text-sidebar-foreground/60 text-[10px] italic">
          {dict.tagline}
        </span>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r md:flex">
      <SidebarBrand />
      <SidebarNav />
    </aside>
  );
}
