"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { joinClub, leaveClub } from "@/actions/clubs";
import { Button } from "@/components/ui/button";

export function JoinLeaveButton({
  clubId,
  isMember,
  isOwner,
}: {
  clubId: string;
  isMember: boolean;
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isOwner) {
    return (
      <Button size="sm" variant="outline" disabled>
        Owner
      </Button>
    );
  }

  function onClick() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clubId", clubId);
      const res = isMember ? await leaveClub(fd) : await joinClub(fd);
      if (res.ok) {
        toast.success(isMember ? "Left the club" : "Joined the club");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={isMember ? "outline" : "default"}
      onClick={onClick}
      disabled={pending}
    >
      {isMember ? "Leave" : "Join"}
    </Button>
  );
}
