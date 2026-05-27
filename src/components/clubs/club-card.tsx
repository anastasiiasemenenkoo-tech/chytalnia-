import Link from "next/link";
import { Users } from "lucide-react";

import { JoinLeaveButton } from "@/components/clubs/join-leave-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";

export async function ClubCard({
  id,
  name,
  description,
  memberCount,
  isMember,
  isOwner,
  currentlyReadingTitle,
}: {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  currentlyReadingTitle: string | null;
}) {
  const dict = await getDictionary();
  const memberLine =
    memberCount === 1
      ? dict.clubs.member
      : interpolate(dict.clubs.members, { n: memberCount });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              <Link href={`/clubs/${id}`} className="hover:underline">
                {name}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {description ?? ""}
            </CardDescription>
          </div>
          {isOwner && <Badge variant="secondary">{dict.clubs.owner}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <div className="text-muted-foreground flex flex-col gap-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {memberLine}
          </span>
          {currentlyReadingTitle && (
            <span className="truncate">
              {dict.clubs.reading}: {currentlyReadingTitle}
            </span>
          )}
        </div>
        <JoinLeaveButton clubId={id} isMember={isMember} isOwner={isOwner} />
      </CardContent>
    </Card>
  );
}
