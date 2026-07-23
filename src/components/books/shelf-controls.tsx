"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { moveBookToShelf, removeBookFromShelf } from "@/actions/books";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDict } from "@/i18n/provider";
import { interpolate } from "@/i18n/interpolate";
import type { ShelfValue } from "@/lib/validators";

export function ShelfControls({
  userBookId,
  shelf,
}: {
  userBookId: string;
  shelf: ShelfValue;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onChange(value: string) {
    if (value === shelf) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userBookId", userBookId);
      fd.set("shelf", value);
      const res = await moveBookToShelf(fd);
      if (res.ok) {
        toast.success(
          interpolate(dict.books.movedTo, {
            shelf: dict.shelves[value as ShelfValue],
          }),
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  function onRemove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userBookId", userBookId);
      const res = await removeBookFromShelf(fd);
      if (res.ok) toast.success(dict.books.removed);
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={shelf} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["WANT_TO_READ", "READING", "READ"] as const).map((s) => (
            <SelectItem key={s} value={s}>
              {dict.shelves[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRemove}
        disabled={pending}
        aria-label={dict.common.remove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
