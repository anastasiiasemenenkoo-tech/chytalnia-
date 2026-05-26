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
import { SHELF_LABELS } from "@/lib/shelf-labels";
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

  function add(shelf: ShelfValue) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("olid", olid);
      fd.set("title", title);
      fd.set("author", author);
      fd.set("coverUrl", coverUrl ?? "");
      fd.set("shelf", shelf);
      const res = await addBookToShelf(fd);
      if (res.ok) toast.success(`Added to "${SHELF_LABELS[shelf]}"`);
      else toast.error(res.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" disabled={pending} />}>
        <Plus className="mr-1 h-4 w-4" />
        Add
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(SHELF_LABELS) as ShelfValue[]).map((s) => (
          <DropdownMenuItem key={s} onClick={() => add(s)}>
            {SHELF_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
