import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

/**
 * The other end of a club's invite link: join and land inside the club.
 *
 * There is no secret in the URL, because there is nothing for one to protect
 * — anyone signed in can already join any club from `/clubs`. This only saves
 * the visitor the trip through the list.
 */
export default async function JoinClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser();

  const club = await prisma.bookClub.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!club) notFound();

  await prisma.clubMembership.upsert({
    where: { userId_clubId: { userId: user.id, clubId: club.id } },
    update: {},
    create: { userId: user.id, clubId: club.id, role: "MEMBER" },
  });

  redirect(`/clubs/${club.id}`);
}
