"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteClubComment } from "@/actions/club-comments";
import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

export function DeleteCommentButton({
  clubId,
  commentId,
}: {
  clubId: string;
  commentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clubId", clubId);
      fd.set("commentId", commentId);
      const res = await deleteClubComment(fd);
      if (res.ok) toast.success(dict.clubs.commentDeleted);
      else toast.error(res.error);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={onDelete}
      disabled={pending}
      aria-label={dict.common.delete}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
