"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { joinClub, leaveClub } from "@/actions/clubs";
import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

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
  const dict = useDict();

  if (isOwner) {
    return (
      <Button size="sm" variant="outline" disabled>
        {dict.clubs.owner}
      </Button>
    );
  }

  function onClick() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clubId", clubId);
      const res = isMember ? await leaveClub(fd) : await joinClub(fd);
      if (res.ok) {
        toast.success(isMember ? dict.clubs.leftToast : dict.clubs.joinedToast);
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
      {isMember ? dict.clubs.leave : dict.clubs.join}
    </Button>
  );
}
