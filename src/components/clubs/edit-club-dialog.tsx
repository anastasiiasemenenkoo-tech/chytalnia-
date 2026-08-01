"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { editClub } from "@/actions/clubs";
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
import { Textarea } from "@/components/ui/textarea";
import { useDict } from "@/i18n/provider";

export function EditClubDialog({
  clubId,
  name,
  description,
  meetingUrl,
}: {
  clubId: string;
  name: string;
  description: string | null;
  meetingUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    formData.set("clubId", clubId);
    startTransition(async () => {
      const res = await editClub(formData);
      if (res.ok) {
        toast.success(dict.clubs.editSaved);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="mr-1 h-4 w-4" />
        {dict.clubs.editAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.clubs.editTitle}</DialogTitle>
          <DialogDescription>{dict.clubs.editSubtitle}</DialogDescription>
        </DialogHeader>
        {/* Keyed on `open` so reopening after a cancel shows the saved values
            again rather than whatever was half-typed last time. */}
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-name">{dict.clubs.nameLabel}</Label>
            <Input
              id="club-name"
              name="name"
              defaultValue={name}
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club-description">
              {dict.clubs.descriptionLabel}
            </Label>
            <Textarea
              id="club-description"
              name="description"
              defaultValue={description ?? ""}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club-meeting-url">
              {dict.clubs.meetingUrlLabel}
            </Label>
            <Input
              id="club-meeting-url"
              name="meetingUrl"
              type="url"
              inputMode="url"
              placeholder="https://meet.google.com/abc-defg-hij"
              defaultValue={meetingUrl ?? ""}
              maxLength={500}
            />
            <p className="text-muted-foreground text-xs">
              {dict.clubs.meetingUrlHint}
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? dict.clubs.editSaving : dict.clubs.editSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
