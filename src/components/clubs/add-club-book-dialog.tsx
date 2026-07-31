"use client";

import { Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { searchBooks } from "@/actions/books";
import { addBookForClub } from "@/actions/clubs";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDict } from "@/i18n/provider";
import type { OpenLibraryHit } from "@/lib/openlibrary";

/**
 * Picks the club's next read out of Open Library and hands it over in one
 * step: the book lands on the owner's "reading" shelf and becomes the club's
 * current book, without a detour through the search page.
 */
export function AddClubBookDialog({
  clubId,
  variant = "outline",
}: {
  clubId: string;
  variant?: "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<OpenLibraryHit[] | null>(null);
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();
  const dict = useDict();

  function onSearch(formData: FormData) {
    const query = String(formData.get("q") ?? "").trim();
    if (!query) return;
    startSearch(async () => {
      setHits(await searchBooks(query));
    });
  }

  function onPick(hit: OpenLibraryHit) {
    startAdd(async () => {
      const fd = new FormData();
      fd.set("clubId", clubId);
      fd.set("olid", hit.olid);
      fd.set("title", hit.title);
      fd.set("author", hit.author);
      fd.set("coverUrl", hit.coverUrl ?? "");
      const res = await addBookForClub(fd);
      if (res.ok) {
        toast.success(dict.clubs.addBookAdded);
        setOpen(false);
        setHits(null);
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
        if (!next) setHits(null);
      }}
    >
      <DialogTrigger render={<Button variant={variant} size="sm" />}>
        <Plus className="mr-1 h-4 w-4" />
        {dict.clubs.addBookAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.clubs.addBookTitle}</DialogTitle>
          <DialogDescription>{dict.clubs.addBookSubtitle}</DialogDescription>
        </DialogHeader>

        <form action={onSearch} className="flex gap-2">
          <Input
            name="q"
            type="search"
            placeholder={dict.books.searchPlaceholder}
            autoFocus
          />
          <Button type="submit" disabled={searching}>
            <Search className="mr-1 h-4 w-4" />
            {searching ? dict.clubs.addBookSearching : dict.books.search}
          </Button>
        </form>

        {hits !== null && (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {hits.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {dict.books.noResults}
              </p>
            ) : (
              hits.map((hit) => (
                <button
                  key={hit.olid}
                  type="button"
                  onClick={() => onPick(hit)}
                  disabled={adding}
                  className="hover:bg-muted flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors disabled:opacity-50"
                >
                  <BookCover
                    src={hit.coverUrl}
                    alt=""
                    className="w-8 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{hit.title}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {hit.author}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
