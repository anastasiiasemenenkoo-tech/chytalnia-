"use client";

import { BookMarked } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateReadingProgress } from "@/actions/books";
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
import { interpolate } from "@/i18n/interpolate";

export function ReadingProgressDialog({
  userBookId,
  title,
  pagesRead,
  totalPages,
}: {
  userBookId: string;
  title: string;
  pagesRead: number | null;
  totalPages: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    formData.set("userBookId", userBookId);
    startTransition(async () => {
      const res = await updateReadingProgress(formData);
      if (res.ok) {
        toast.success(dict.books.progressSaved);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  const triggerLabel =
    pagesRead != null && totalPages
      ? dict.books.progressUpdate
      : dict.books.progressSet;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <BookMarked className="mr-1 h-4 w-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.books.progressTitle}</DialogTitle>
          <DialogDescription>
            {interpolate(dict.books.progressSubtitle, { book: title })}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`pagesRead-${userBookId}`}>
                {dict.books.progressPagesRead}
              </Label>
              <Input
                id={`pagesRead-${userBookId}`}
                name="pagesRead"
                type="number"
                inputMode="numeric"
                min={0}
                max={100000}
                defaultValue={pagesRead ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`totalPages-${userBookId}`}>
                {dict.books.progressTotalPages}
              </Label>
              <Input
                id={`totalPages-${userBookId}`}
                name="totalPages"
                type="number"
                inputMode="numeric"
                min={1}
                max={100000}
                defaultValue={totalPages ?? ""}
                placeholder="e.g. 320"
                required
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            {dict.books.progressHint}
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? dict.books.progressSaving : dict.books.progressSave}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
