"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addClubMember } from "@/actions/clubs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

/**
 * Takes a full address rather than offering a people search: the club has no
 * business listing readers who never asked to be found.
 */
export function AddClubMemberDialog({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    formData.set("clubId", clubId);
    startTransition(async () => {
      const res = await addClubMember(formData);
      if (res.ok) {
        toast.success(dict.clubs.addMemberDone);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="mr-1 h-4 w-4" />
        {dict.clubs.addMemberAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.clubs.addMemberTitle}</DialogTitle>
          <DialogDescription>{dict.clubs.addMemberSubtitle}</DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-member-email">
              {dict.clubs.addMemberEmailLabel}
            </Label>
            <Input
              id="add-member-email"
              name="email"
              type="email"
              autoComplete="off"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? dict.clubs.addMemberSaving : dict.clubs.addMemberSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
