import { BookCover } from "@/components/books/book-cover";
import { ShelfControls } from "@/components/books/shelf-controls";
import { Badge } from "@/components/ui/badge";
import { SHELF_LABELS } from "@/lib/shelf-labels";
import type { ShelfValue } from "@/lib/validators";

export function BookCard({
  userBookId,
  title,
  author,
  coverUrl,
  shelf,
  finishedAt,
}: {
  userBookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  shelf: ShelfValue;
  finishedAt: Date | null;
}) {
  return (
    <article className="bg-card text-card-foreground flex gap-4 rounded-lg border p-4">
      <div className="w-20 shrink-0">
        <BookCover src={coverUrl} alt={title} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm leading-snug font-medium" title={title}>
          {title}
        </h3>
        <p className="text-muted-foreground truncate text-xs">{author}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{SHELF_LABELS[shelf]}</Badge>
          {finishedAt && (
            <Badge variant="outline">
              Finished{" "}
              {finishedAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Badge>
          )}
        </div>
        <div className="mt-auto pt-3">
          <ShelfControls userBookId={userBookId} shelf={shelf} />
        </div>
      </div>
    </article>
  );
}
