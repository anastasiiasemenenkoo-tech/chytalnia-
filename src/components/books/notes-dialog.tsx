"use client";

import { Lock, NotebookPen } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateNotes } from "@/actions/books";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDict } from "@/i18n/provider";
import { interpolate } from "@/i18n/interpolate";

export function NotesDialog({
  userBookId,
  title,
  notes,
}: {
  userBookId: string;
  title: string;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dict = useDict();
  const hasNotes = !!notes?.trim();

  function onSubmit(formData: FormData) {
    formData.set("userBookId", userBookId);
    startTransition(async () => {
      const res = await updateNotes(formData);
      if (res.ok) {
        toast.success(dict.books.notesSaved);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="relative" />}
      >
        <NotebookPen className="mr-1 h-4 w-4" />
        {dict.books.notesBtn}
        {hasNotes && (
          <span
            aria-label={dict.books.notesPrivate}
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-foreground"
          />
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dict.books.notesTitle}
            <Lock
              className="text-muted-foreground h-3.5 w-3.5"
              aria-label={dict.books.notesPrivate}
            />
          </DialogTitle>
          <DialogDescription>
            {interpolate(dict.books.notesSubtitle, { book: title })}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`notes-${userBookId}`} className="sr-only">
              {dict.books.notesTitle}
            </Label>
            <Textarea
              id={`notes-${userBookId}`}
              name="notes"
              rows={8}
              maxLength={4000}
              defaultValue={notes ?? ""}
              placeholder={dict.books.notesPlaceholder}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? dict.books.notesSaving : dict.books.notesSave}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
