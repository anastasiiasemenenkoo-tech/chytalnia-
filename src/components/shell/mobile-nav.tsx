"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { SidebarBrand, SidebarNav } from "@/components/shell/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDict } from "@/i18n/provider";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const dict = useDict();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={dict.topbar.openMenu}
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground flex w-64 flex-col p-0"
      >
        <SheetTitle className="sr-only">{dict.nav.overview}</SheetTitle>
        <SidebarBrand />
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
