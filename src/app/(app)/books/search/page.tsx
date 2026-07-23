import { Search } from "lucide-react";

import { SearchResults } from "@/components/books/search-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/i18n";
import { searchOpenLibrary } from "@/lib/openlibrary";

export default async function BookSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const dict = await getDictionary();
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const hits = query ? await searchOpenLibrary(query) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.books.searchTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {dict.books.searchSubtitle}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-2" action="/books/search">
            <Input
              type="search"
              name="q"
              placeholder={dict.books.searchPlaceholder}
              defaultValue={query}
              autoFocus
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              {dict.books.search}
            </Button>
          </form>
        </CardContent>
      </Card>

      {query ? (
        <SearchResults hits={hits} />
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            {dict.books.typeToBegin}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
