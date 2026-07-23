"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { postClubComment } from "@/actions/club-comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDict } from "@/i18n/provider";

export function CommentForm({
  clubId,
  parentId,
  onPosted,
}: {
  clubId: string;
  parentId?: string;
  onPosted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    formData.set("clubId", clubId);
    if (parentId) formData.set("parentId", parentId);
    startTransition(async () => {
      const res = await postClubComment(formData);
      if (res.ok) {
        toast.success(dict.clubs.commentPosted);
        formRef.current?.reset();
        onPosted?.();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2">
      <Textarea
        name="body"
        placeholder={
          parentId ? dict.clubs.replyPlaceholder : dict.clubs.commentPlaceholder
        }
        required
        maxLength={2000}
        rows={parentId ? 2 : 3}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? dict.clubs.commentSubmitting
            : parentId
              ? dict.clubs.replySubmit
              : dict.clubs.commentSubmit}
        </Button>
      </div>
    </form>
  );
}
