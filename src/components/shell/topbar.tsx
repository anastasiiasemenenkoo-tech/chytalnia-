import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function initials(input: string | null | undefined, fallback: string) {
  const src = (input ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Topbar({
  user,
}: {
  user: { email: string; name: string | null };
}) {
  return (
    <header className="bg-background flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="text-muted-foreground text-sm">
        Welcome back{user.name ? `, ${user.name}` : ""}
      </div>
      <div className="flex items-center gap-3">
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
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
