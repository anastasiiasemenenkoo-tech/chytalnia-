import { AddToShelfButton } from "@/components/books/add-to-shelf-button";
import { BookCover } from "@/components/books/book-cover";
import { Card, CardContent } from "@/components/ui/card";
import type { OpenLibraryHit } from "@/lib/openlibrary";

export function SearchResults({ hits }: { hits: OpenLibraryHit[] }) {
  if (hits.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          No results. Try a different title or author.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hits.map((hit) => (
        <li
          key={hit.olid}
          className="bg-card text-card-foreground flex gap-4 rounded-lg border p-4"
        >
          <div className="w-20 shrink-0">
            <BookCover src={hit.coverUrl} alt={hit.title} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-sm leading-snug font-medium">{hit.title}</h3>
            <p className="text-muted-foreground truncate text-xs">
              {hit.author}
            </p>
            <div className="mt-auto pt-3">
              <AddToShelfButton
                olid={hit.olid}
                title={hit.title}
                author={hit.author}
                coverUrl={hit.coverUrl}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
