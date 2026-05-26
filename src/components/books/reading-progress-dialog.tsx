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

  function onSubmit(formData: FormData) {
    formData.set("userBookId", userBookId);
    startTransition(async () => {
      const res = await updateReadingProgress(formData);
      if (res.ok) {
        toast.success("Progress updated");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <BookMarked className="mr-1 h-4 w-4" />
        {pagesRead != null && totalPages ? "Update progress" : "Set progress"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reading progress</DialogTitle>
          <DialogDescription>
            How far are you into &ldquo;{title}&rdquo;?
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`pagesRead-${userBookId}`}>Pages read</Label>
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
              <Label htmlFor={`totalPages-${userBookId}`}>Total pages</Label>
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
            Marking 100% will move this book to &ldquo;Read&rdquo;.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
