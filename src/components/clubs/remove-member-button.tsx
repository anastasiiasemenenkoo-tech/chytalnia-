"use client";

import { UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { removeClubMember } from "@/actions/clubs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { interpolate, useDict } from "@/i18n/provider";

/**
 * Confirms first: unlike deleting your own comment, this one lands on
 * somebody else and there is no undo beyond asking them to rejoin.
 */
export function RemoveMemberButton({
  clubId,
  userId,
  name,
}: {
  clubId: string;
  userId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onRemove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clubId", clubId);
      fd.set("userId", userId);
      const res = await removeClubMember(fd);
      if (res.ok) {
        toast.success(dict.clubs.removeMemberDone);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={dict.clubs.removeMemberAction}
          />
        }
      >
        <UserMinus className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {interpolate(dict.clubs.removeMemberConfirm, { name })}
          </DialogTitle>
          <DialogDescription>
            {dict.clubs.removeMemberConfirmBody}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {dict.common.cancel}
          </Button>
          <Button type="button" onClick={onRemove} disabled={pending}>
            {dict.clubs.removeMemberSubmit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
