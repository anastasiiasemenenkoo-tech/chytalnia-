import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

export function BookCover({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex aspect-[2/3] items-center justify-center rounded-md border",
          className,
        )}
      >
        <BookOpen className="h-6 w-6" />
      </div>
    );
  }
  return (
    // Open Library covers come from their CDN; we don't run them through next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        "aspect-[2/3] w-full rounded-md border object-cover",
        className,
      )}
      loading="lazy"
    />
  );
}
