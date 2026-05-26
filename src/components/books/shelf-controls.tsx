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
import { SHELF_LABELS } from "@/lib/shelf-labels";
import type { ShelfValue } from "@/lib/validators";

export function ShelfControls({
  userBookId,
  shelf,
}: {
  userBookId: string;
  shelf: ShelfValue;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    if (value === shelf) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userBookId", userBookId);
      fd.set("shelf", value);
      const res = await moveBookToShelf(fd);
      if (res.ok) {
        toast.success(`Moved to "${SHELF_LABELS[value as ShelfValue]}"`);
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
      if (res.ok) toast.success("Removed from your shelves");
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
          {(Object.keys(SHELF_LABELS) as ShelfValue[]).map((s) => (
            <SelectItem key={s} value={s}>
              {SHELF_LABELS[s]}
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
        aria-label="Remove from shelves"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
