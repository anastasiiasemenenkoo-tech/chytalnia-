"use client";

import { Pencil, Target } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setYearlyGoal } from "@/actions/auth";
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

export function EditYearlyGoalDialog({
  currentGoal,
}: {
  currentGoal: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await setYearlyGoal(formData);
      if (res.ok) {
        toast.success(
          formData.get("target") === "0" ? "Goal cleared" : "Goal updated",
        );
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {currentGoal != null ? (
          <>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </>
        ) : (
          <>
            <Target className="mr-1 h-3.5 w-3.5" />
            Set goal
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yearly reading goal</DialogTitle>
          <DialogDescription>
            How many books would you like to read this year? Set to 0 to clear
            the goal.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Books</Label>
            <Input
              id="target"
              name="target"
              type="number"
              inputMode="numeric"
              min={0}
              max={1000}
              defaultValue={currentGoal ?? 12}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
