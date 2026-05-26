import { Search } from "lucide-react";

import { SearchResults } from "@/components/books/search-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchOpenLibrary } from "@/lib/openlibrary";

export default async function BookSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const hits = query ? await searchOpenLibrary(query) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Find books</h1>
        <p className="text-muted-foreground text-sm">
          Search Open Library by title or author, then add to one of your shelves.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-2" action="/books/search">
            <Input
              type="search"
              name="q"
              placeholder="The hobbit, Le Guin, Sapiens..."
              defaultValue={query}
              autoFocus
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {query ? (
        <SearchResults hits={hits} />
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Type a title or author above to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
