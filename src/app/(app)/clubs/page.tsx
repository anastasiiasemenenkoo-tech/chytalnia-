import Link from "next/link";
import { Plus } from "lucide-react";

import { ClubCard } from "@/components/clubs/club-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export default async function ClubsPage() {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const clubs = await prisma.bookClub.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true } },
      memberships: {
        where: { userId: user.id },
        select: { role: true },
      },
      currentlyReadingBook: { select: { title: true } },
    },
  });

  const myClubs = clubs.filter((c) => c.memberships.length > 0);
  const otherClubs = clubs.filter((c) => c.memberships.length === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.clubs.title}
          </h1>
          <p className="text-muted-foreground text-sm">{dict.clubs.subtitle}</p>
        </div>
        <Link href="/clubs/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          {dict.clubs.newClub}
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{dict.clubs.mySection}</h2>
        {myClubs.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              {dict.clubs.emptyMine}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myClubs.map((c) => (
              <ClubCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                memberCount={c._count.memberships}
                isMember
                isOwner={c.memberships[0]?.role === "OWNER"}
                currentlyReadingTitle={c.currentlyReadingBook?.title ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{dict.clubs.discoverSection}</h2>
        {otherClubs.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              {dict.clubs.emptyOthersPrefix}
              <Link href="/clubs/new" className="underline">
                {dict.clubs.emptyOthersAction}
              </Link>
              {dict.clubs.emptyOthersSuffix}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherClubs.map((c) => (
              <ClubCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                memberCount={c._count.memberships}
                isMember={false}
                isOwner={false}
                currentlyReadingTitle={c.currentlyReadingBook?.title ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
