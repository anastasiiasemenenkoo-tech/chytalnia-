import Link from "next/link";
import { UserRound } from "lucide-react";

import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { ProfileForm } from "@/components/account/profile-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const ownedClubCount = await prisma.bookClub.count({
    where: { ownerId: user.id },
  });

  const pendingChange = await prisma.emailChangeToken.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { newEmail: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.account.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {dict.account.subtitle}
          </p>
        </div>
        <Link
          href={`/readers/${user.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <UserRound className="mr-1 h-4 w-4" />
          {dict.account.viewProfile}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {dict.account.basicsTitle}
          </CardTitle>
          <CardDescription>{dict.account.basicsSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            name={user.name}
            email={user.email}
            pendingEmail={pendingChange?.newEmail ?? null}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive text-base">
            {dict.account.dangerTitle}
          </CardTitle>
          <CardDescription>{dict.account.dangerSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog
            email={user.email}
            ownedClubCount={ownedClubCount}
          />
        </CardContent>
      </Card>
    </div>
  );
}
