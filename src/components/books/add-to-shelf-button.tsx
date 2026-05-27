"use client";

import { Plus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { addBookToShelf } from "@/actions/books";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDict } from "@/i18n/provider";
import { interpolate } from "@/i18n/interpolate";
import type { ShelfValue } from "@/lib/validators";

export function AddToShelfButton({
  olid,
  title,
  author,
  coverUrl,
}: {
  olid: string;
  title: string;
  author: string;
  coverUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function add(shelf: ShelfValue) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("olid", olid);
      fd.set("title", title);
      fd.set("author", author);
      fd.set("coverUrl", coverUrl ?? "");
      fd.set("shelf", shelf);
      const res = await addBookToShelf(fd);
      if (res.ok) {
        toast.success(
          interpolate(dict.books.addedTo, { shelf: dict.shelves[shelf] }),
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" disabled={pending} />}>
        <Plus className="mr-1 h-4 w-4" />
        {dict.books.add}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["WANT_TO_READ", "READING", "READ"] as const).map((s) => (
          <DropdownMenuItem key={s} onClick={() => add(s)}>
            {dict.shelves[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
