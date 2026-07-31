import Link from "next/link";
import { Swords, Trophy } from "lucide-react";

import { BookCover } from "@/components/books/book-cover";
import {
  DuelCancelButton,
  DuelResponseButtons,
} from "@/components/duels/duel-response-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

type DuelRow = Awaited<ReturnType<typeof loadDuels>>[number];

async function loadDuels(userId: string) {
  return prisma.readingDuel.findMany({
    where: {
      OR: [{ challengerId: userId }, { opponentId: userId }],
      status: { in: ["PENDING", "ACTIVE", "FINISHED"] },
    },
    include: {
      book: true,
      club: { select: { id: true, name: true } },
      challenger: { select: { id: true, name: true } },
      opponent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

function displayName(user: { name: string | null }, fallback: string) {
  return user.name ?? fallback;
}

export default async function DuelsPage() {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const duels = await loadDuels(user.id);

  const incoming = duels.filter(
    (d) => d.status === "PENDING" && d.opponentId === user.id,
  );
  const outgoing = duels.filter(
    (d) => d.status === "PENDING" && d.challengerId === user.id,
  );
  const active = duels.filter((d) => d.status === "ACTIVE");
  const finished = duels.filter((d) => d.status === "FINISHED");

  function DuelCard({
    duel,
    footer,
  }: {
    duel: DuelRow;
    footer?: React.ReactNode;
  }) {
    const rival =
      duel.challengerId === user.id ? duel.opponent : duel.challenger;
    const iWon = duel.winnerId === user.id;

    return (
      <Card>
        <CardContent className="flex gap-4">
          <div className="w-14 shrink-0">
            <BookCover src={duel.book.coverUrl} alt={duel.book.title} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{duel.book.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {dict.duels.versus} {displayName(rival, dict.common.unnamedReader)}
              </p>
              <Link
                href={`/clubs/${duel.club.id}`}
                className="text-muted-foreground truncate text-xs hover:underline"
              >
                {duel.club.name}
              </Link>
            </div>
            {duel.status === "FINISHED" && (
              <div>
                <Badge variant={iWon ? "default" : "secondary"}>
                  {iWon && <Trophy className="mr-1 h-3 w-3" />}
                  {iWon ? dict.duels.youWon : dict.duels.youLost}
                </Badge>
              </div>
            )}
            {footer}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = duels.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.duels.title}
        </h1>
        <p className="text-muted-foreground text-sm">{dict.duels.subtitle}</p>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Swords className="text-muted-foreground mx-auto mb-3 h-6 w-6" />
            <p className="text-muted-foreground text-sm">{dict.duels.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {incoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                {dict.duels.incomingTitle}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {incoming.map((duel) => (
                  <DuelCard
                    key={duel.id}
                    duel={duel}
                    footer={<DuelResponseButtons duelId={duel.id} />}
                  />
                ))}
              </div>
            </section>
          )}

          {outgoing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                {dict.duels.outgoingTitle}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {outgoing.map((duel) => (
                  <DuelCard
                    key={duel.id}
                    duel={duel}
                    footer={
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs">
                          {dict.duels.waitingForAnswer}
                        </span>
                        <DuelCancelButton duelId={duel.id} />
                      </div>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">{dict.duels.activeTitle}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {active.map((duel) => (
                  <DuelCard
                    key={duel.id}
                    duel={duel}
                    footer={
                      <p className="text-muted-foreground text-xs">
                        {dict.duels.finishToWin}
                      </p>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                {dict.duels.finishedTitle}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {finished.map((duel) => (
                  <DuelCard key={duel.id} duel={duel} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
