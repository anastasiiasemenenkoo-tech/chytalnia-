"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addBookForClub } from "@/actions/clubs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

/**
 * Adds a book to the owner's shelves and hands it to the club at once, so an
 * empty shelf isn't a dead end on the club page.
 */
export function AddClubBookDialog({
  clubId,
  variant = "outline",
}: {
  clubId: string;
  variant?: "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    formData.set("clubId", clubId);
    startTransition(async () => {
      const res = await addBookForClub(formData);
      if (res.ok) {
        toast.success(dict.clubs.addBookAdded);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size="sm" />}>
        <Plus className="mr-1 h-4 w-4" />
        {dict.clubs.addBookAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.clubs.addBookTitle}</DialogTitle>
          <DialogDescription>{dict.clubs.addBookSubtitle}</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-book-title">
              {dict.books.manualTitleLabel}
            </Label>
            <Input id="club-book-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club-book-author">
              {dict.books.manualAuthorLabel}
            </Label>
            <Input id="club-book-author" name="author" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? dict.clubs.addBookSaving : dict.clubs.addBookSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
