"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  type LucideIcon,
  Search,
  Users,
} from "lucide-react";

import { useDict } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type NavItem = { href: string; labelKey: "overview" | "myBooks" | "findBooks" | "clubs"; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard },
  { href: "/books", labelKey: "myBooks", icon: Library },
  { href: "/books/search", labelKey: "findBooks", icon: Search },
  { href: "/clubs", labelKey: "clubs", icon: Users },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const dict = useDict();
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
    <div className="flex h-14 items-center gap-2 border-b px-5 text-base font-semibold">
      <BookOpen className="h-5 w-5" />
      {dict.brand}
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
