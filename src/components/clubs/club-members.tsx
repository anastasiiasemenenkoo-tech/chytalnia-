import { ReadingProgressBar } from "@/components/books/reading-progress-bar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";

function initials(input: string | null, fallback: string) {
  const src = (input ?? fallback).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function ClubMembers({
  memberships,
  progressByUserId,
  hasCurrentBook,
}: {
  memberships: Array<{
    id: string;
    userId: string;
    role: "OWNER" | "MEMBER";
    user: { id: string; name: string | null; email: string };
  }>;
  progressByUserId: Map<string, { pagesRead: number | null; totalPages: number | null }>;
  hasCurrentBook: boolean;
}) {
  const dict = await getDictionary();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.clubs.membersTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {memberships.map((m) => {
            const progress = progressByUserId.get(m.userId);
            return (
              <li key={m.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials(m.user.name, m.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {m.user.name ?? m.user.email}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {m.user.email}
                      </p>
                    </div>
                  </div>
                  {m.role === "OWNER" && (
                    <Badge variant="secondary">{dict.clubs.owner}</Badge>
                  )}
                </div>
                {hasCurrentBook &&
                  (progress?.pagesRead != null && progress.totalPages ? (
                    <ReadingProgressBar
                      className="ml-11"
                      pagesRead={progress.pagesRead}
                      totalPages={progress.totalPages}
                    />
                  ) : (
                    <p className="text-muted-foreground ml-11 text-xs">
                      {dict.clubs.noProgressYet}
                    </p>
                  ))}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
