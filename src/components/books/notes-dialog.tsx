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
  const hasNotes = !!notes?.trim();

  function onSubmit(formData: FormData) {
    formData.set("userBookId", userBookId);
    startTransition(async () => {
      const res = await updateNotes(formData);
      if (res.ok) {
        toast.success("Notes saved");
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
        Notes
        {hasNotes && (
          <span
            aria-label="Has notes"
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-foreground"
          />
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Notes
            <Lock
              className="text-muted-foreground h-3.5 w-3.5"
              aria-label="Private to you"
            />
          </DialogTitle>
          <DialogDescription>
            Private to you. Use this for highlights, quotes, or your own
            running thoughts on &ldquo;{title}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`notes-${userBookId}`} className="sr-only">
              Notes
            </Label>
            <Textarea
              id={`notes-${userBookId}`}
              name="notes"
              rows={8}
              maxLength={4000}
              defaultValue={notes ?? ""}
              placeholder="Anything you want to remember..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save notes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
