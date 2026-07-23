"use client";

import { PenLine } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateReviewAndRating } from "@/actions/books";
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

export function ReviewDialog({
  userBookId,
  title,
  rating,
  review,
}: {
  userBookId: string;
  title: string;
  rating: number | null;
  review: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(rating ?? 0);
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    if (draftRating < 1) {
      toast.error(dict.books.reviewPickStars);
      return;
    }
    formData.set("userBookId", userBookId);
    formData.set("rating", String(draftRating));
    startTransition(async () => {
      const res = await updateReviewAndRating(formData);
      if (res.ok) {
        toast.success(review ? dict.books.reviewUpdated : dict.books.reviewSaved);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraftRating(rating ?? 0);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PenLine className="mr-1 h-4 w-4" />
        {review ? dict.books.reviewEdit : dict.books.reviewWrite}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.books.reviewTitle}</DialogTitle>
          <DialogDescription>
            {interpolate(dict.books.reviewSubtitle, { book: title })}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{dict.books.reviewRatingLabel}</Label>
            <InteractiveStars value={draftRating} onChange={setDraftRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`review-${userBookId}`}>
              {dict.books.reviewLabel}
            </Label>
            <Textarea
              id={`review-${userBookId}`}
              name="review"
              rows={5}
              maxLength={2000}
              defaultValue={review ?? ""}
              placeholder={dict.books.reviewPlaceholder}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? dict.books.reviewSaving : dict.books.reviewSave}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InteractiveStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => {
        const filled = v <= value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v === value ? 0 : v)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${v}`}
          >
            <svg
              viewBox="0 0 24 24"
              className={
                "h-6 w-6 " +
                (filled
                  ? "fill-yellow-400 stroke-yellow-400"
                  : "fill-none stroke-muted-foreground")
              }
              strokeWidth={1.5}
              strokeLinejoin="round"
            >
              <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
