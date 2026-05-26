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

export function ClubCard({
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
              {description ?? "No description yet."}
            </CardDescription>
          </div>
          {isOwner && <Badge variant="secondary">Owner</Badge>}
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <div className="text-muted-foreground flex flex-col gap-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
          {currentlyReadingTitle && (
            <span className="truncate">Reading: {currentlyReadingTitle}</span>
          )}
        </div>
        <JoinLeaveButton clubId={id} isMember={isMember} isOwner={isOwner} />
      </CardContent>
    </Card>
  );
}
