"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { setClubCurrentBook } from "@/actions/clubs";
import { AddClubBookDialog } from "@/components/clubs/add-club-book-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDict } from "@/i18n/provider";

export function SetCurrentBook({
  clubId,
  currentBookId,
  options,
}: {
  clubId: string;
  currentBookId: string | null;
  options: { id: string; title: string; author: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">{dict.clubs.setEmpty}</p>
        <AddClubBookDialog clubId={clubId} variant="default" />
      </div>
    );
  }

  function onSubmit(formData: FormData) {
    formData.set("clubId", clubId);
    startTransition(async () => {
      const res = await setClubCurrentBook(formData);
      if (res.ok) toast.success(dict.clubs.setSaved);
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <form action={onSubmit} className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <Select name="bookId" defaultValue={currentBookId ?? undefined}>
            <SelectTrigger>
              <SelectValue placeholder={dict.clubs.setPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title} — {b.author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? dict.clubs.setSaving : dict.clubs.setSave}
        </Button>
      </form>
      {/* Also reachable when the shelves aren't empty: the club's next book
          often isn't one you already own. */}
      <AddClubBookDialog clubId={clubId} />
    </div>
  );
}
