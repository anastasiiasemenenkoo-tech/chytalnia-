"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { clearRating, setRating } from "@/actions/books";
import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({
  userBookId,
  rating,
  readOnly = false,
  size = "sm",
}: {
  userBookId?: string;
  rating: number | null;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const displayed = hover ?? rating ?? 0;
  const dim = size === "md" ? "h-5 w-5" : "h-4 w-4";

  function handleClick(value: number) {
    if (readOnly || !userBookId) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userBookId", userBookId);
      if (value === rating) {
        // clicking the current rating clears it
        const res = await clearRating(fd);
        if (res.ok) toast.success("Rating cleared");
        else toast.error(res.error);
      } else {
        fd.set("rating", String(value));
        const res = await setRating(fd);
        if (res.ok) toast.success(`Rated ${value}/5`);
        else toast.error(res.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5",
        readOnly ? "" : "cursor-pointer",
        pending && "opacity-60",
      )}
      onMouseLeave={() => setHover(null)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={
        rating ? `Rated ${rating} out of 5 stars` : "Not rated yet"
      }
    >
      {STARS.map((v) => {
        const filled = v <= displayed;
        return (
          <button
            key={v}
            type="button"
            disabled={readOnly || pending}
            onMouseEnter={() => !readOnly && setHover(v)}
            onClick={() => handleClick(v)}
            className={cn(
              "rounded-sm p-0.5 transition-colors",
              !readOnly &&
                "hover:scale-110 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
              readOnly && "cursor-default",
            )}
            aria-label={`${v} star${v === 1 ? "" : "s"}`}
            aria-pressed={rating === v}
            tabIndex={readOnly ? -1 : 0}
          >
            <Star
              className={cn(
                dim,
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
