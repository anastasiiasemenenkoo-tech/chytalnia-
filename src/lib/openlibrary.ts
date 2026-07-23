export type OpenLibraryHit = {
  olid: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

type RawDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
};

export function coverUrlFromId(coverId: number, size: "S" | "M" | "L" = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function searchOpenLibrary(
  query: string,
  limit = 12,
): Promise<OpenLibraryHit[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `https://openlibrary.org/search.json?` +
    new URLSearchParams({
      q,
      limit: String(limit),
      fields: "key,title,author_name,cover_i",
    }).toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "reader-dashboard (learning project)" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { docs?: RawDoc[] };
  const docs = data.docs ?? [];

  return docs
    .filter((d) => d.key && d.title)
    .map((d) => ({
      olid: d.key!.replace(/^\/works\//, ""),
      title: d.title!,
      author: d.author_name?.[0] ?? "Unknown",
      coverUrl: d.cover_i ? coverUrlFromId(d.cover_i) : null,
    }));
}
