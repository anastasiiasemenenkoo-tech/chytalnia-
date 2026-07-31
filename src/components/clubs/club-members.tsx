import { ReadingProgressBar } from "@/components/books/reading-progress-bar";
import { InviteLinkDialog } from "@/components/clubs/invite-link-dialog";
import { RemoveMemberButton } from "@/components/clubs/remove-member-button";
import { ChallengeButton } from "@/components/duels/challenge-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";

function initials(input: string | null, fallback: string | null) {
  const src = (input ?? fallback ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function ClubMembers({
  memberships,
  progressByUserId,
  hasCurrentBook,
  clubId,
  currentUserId,
  canChallenge,
  isOwner,
}: {
  memberships: Array<{
    id: string;
    userId: string;
    role: "OWNER" | "MEMBER";
    /** `email` is set only for the signed-in user's own row. */
    user: { id: string; name: string | null; email: string | null };
  }>;
  progressByUserId: Map<string, { pagesRead: number | null; totalPages: number | null }>;
  hasCurrentBook: boolean;
  clubId: string;
  currentUserId: string;
  canChallenge: boolean;
  isOwner: boolean;
}) {
  const dict = await getDictionary();

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{dict.clubs.membersTitle}</CardTitle>
        {isOwner && <InviteLinkDialog clubId={clubId} />}
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
                        {m.user.name ?? dict.common.unnamedReader}
                      </p>
                      {m.user.email && (
                        <p className="text-muted-foreground truncate text-xs">
                          {m.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.role === "OWNER" && (
                      <Badge variant="secondary">{dict.clubs.owner}</Badge>
                    )}
                    {canChallenge && m.userId !== currentUserId && (
                      <ChallengeButton
                        clubId={clubId}
                        opponentId={m.userId}
                      />
                    )}
                    {isOwner && m.role !== "OWNER" && (
                      <RemoveMemberButton
                        clubId={clubId}
                        userId={m.userId}
                        name={m.user.name ?? dict.common.unnamedReader}
                      />
                    )}
                  </div>
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
