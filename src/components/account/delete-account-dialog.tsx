"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAccount } from "@/actions/account";
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
import { interpolate, useDict } from "@/i18n/provider";

/**
 * Typing the address back is the whole safety mechanism. A checkbox or a
 * second "are you sure" is something you can click through on reflex; an
 * address has to be read first.
 */
export function DeleteAccountDialog({
  email,
  ownedClubCount,
}: {
  email: string;
  ownedClubCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await deleteAccount(formData);
      // Success ends in a redirect, so reaching here at all means it failed.
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 className="mr-1 h-4 w-4" />
        {dict.account.deleteAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.account.deleteTitle}</DialogTitle>
          <DialogDescription>{dict.account.deleteBody}</DialogDescription>
        </DialogHeader>

        {ownedClubCount > 0 && (
          <p className="text-muted-foreground text-sm">
            {dict.account.deleteClubsNote}
          </p>
        )}

        <form action={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              {interpolate(dict.account.deleteConfirmLabel, { email })}
            </Label>
            <Input
              id="delete-confirm"
              name="confirm"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {dict.common.cancel}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || !matches}
            >
              {pending ? dict.account.deleting : dict.account.deleteSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
