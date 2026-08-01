"use client";

import Link from "next/link";
import { Settings, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDict } from "@/i18n/provider";

/**
 * Hangs off the avatar rather than adding buttons to the top bar: that row
 * already ran off the side of a phone once.
 */
export function AccountMenu({
  userId,
  initials,
}: {
  userId: string;
  initials: string;
}) {
  const dict = useDict();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
            aria-label={dict.account.menuLabel}
          />
        }
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          render={<Link href={`/readers/${userId}`} />}
          className="cursor-pointer"
        >
          <UserRound className="mr-1 h-4 w-4" />
          {dict.account.myProfile}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href="/settings" />}
          className="cursor-pointer"
        >
          <Settings className="mr-1 h-4 w-4" />
          {dict.account.settings}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
