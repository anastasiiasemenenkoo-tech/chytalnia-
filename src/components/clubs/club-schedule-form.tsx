"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateClubSchedule } from "@/actions/clubs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

export function ClubScheduleForm({
  clubId,
  startDate,
  dueDate,
}: {
  clubId: string;
  startDate: string;
  dueDate: string;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    formData.set("clubId", clubId);
    startTransition(async () => {
      const res = await updateClubSchedule(formData);
      if (res.ok) toast.success(dict.clubs.scheduleSaved);
      else toast.error(res.error);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="startDate" className="text-xs">
          {dict.clubs.scheduleStartLabel}
        </Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={startDate}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dueDate" className="text-xs">
          {dict.clubs.scheduleDueLabel}
        </Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={dueDate}
          className="h-8 text-xs"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? dict.clubs.scheduleSaving : dict.clubs.scheduleSave}
      </Button>
    </form>
  );
}
