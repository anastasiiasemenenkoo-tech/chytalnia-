"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { followReader, unfollowReader } from "@/actions/follows";
import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

export function FollowButton({
  readerId,
  isFollowing,
  size = "sm",
}: {
  readerId: string;
  isFollowing: boolean;
  size?: "sm" | "default";
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onClick() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("readerId", readerId);
      const res = isFollowing
        ? await unfollowReader(fd)
        : await followReader(fd);
      if (res.ok) {
        toast.success(
          isFollowing ? dict.readers.unfollowed : dict.readers.followed,
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "outline" : "default"}
      onClick={onClick}
      disabled={pending}
    >
      {isFollowing ? (
        <UserCheck className="mr-1 h-4 w-4" />
      ) : (
        <UserPlus className="mr-1 h-4 w-4" />
      )}
      {isFollowing ? dict.readers.following : dict.readers.follow}
    </Button>
  );
}
