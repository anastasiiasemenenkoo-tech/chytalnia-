import { BookCover } from "@/components/books/book-cover";
import { NotesDialog } from "@/components/books/notes-dialog";
import { ReadingProgressBar } from "@/components/books/reading-progress-bar";
import { ReadingProgressDialog } from "@/components/books/reading-progress-dialog";
import { ReviewDialog } from "@/components/books/review-dialog";
import { ShelfControls } from "@/components/books/shelf-controls";
import { StarRating } from "@/components/books/star-rating";
import { Badge } from "@/components/ui/badge";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import type { ShelfValue } from "@/lib/validators";

export async function BookCard({
  userBookId,
  title,
  author,
  coverUrl,
  shelf,
  finishedAt,
  pagesRead,
  totalPages,
  rating,
  review,
  notes,
}: {
  userBookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  shelf: ShelfValue;
  finishedAt: Date | null;
  pagesRead: number | null;
  totalPages: number | null;
  rating: number | null;
  review: string | null;
  notes: string | null;
}) {
  const dict = await getDictionary();
  const locale = await getLocale();

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
        {shelf !== "WANT_TO_READ" && (
          <div className="mt-2">
            <StarRating userBookId={userBookId} rating={rating} />
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{dict.shelves[shelf]}</Badge>
          {finishedAt && (
            <Badge variant="outline">
              {interpolate(dict.books.finished, {
                date: finishedAt.toLocaleDateString(
                  locale === "uk" ? "uk-UA" : "en-US",
                  { year: "numeric", month: "short", day: "numeric" },
                ),
              })}
            </Badge>
          )}
        </div>
        {shelf === "READING" && (
          <div className="mt-3">
            <ReadingProgressBar
              pagesRead={pagesRead}
              totalPages={totalPages}
            />
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <ShelfControls userBookId={userBookId} shelf={shelf} />
          {shelf === "READING" && (
            <ReadingProgressDialog
              userBookId={userBookId}
              title={title}
              pagesRead={pagesRead}
              totalPages={totalPages}
            />
          )}
          {shelf !== "WANT_TO_READ" && (
            <ReviewDialog
              userBookId={userBookId}
              title={title}
              rating={rating}
              review={review}
            />
          )}
          <NotesDialog userBookId={userBookId} title={title} notes={notes} />
        </div>
      </div>
    </article>
  );
}
