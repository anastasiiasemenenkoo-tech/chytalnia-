"use client";

import { Check, Copy, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

export function InviteLinkDialog({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dict = useDict();

  // Built in the browser rather than passed down: only the browser knows
  // which host this club is being read on — localhost, preview, or prod.
  // Safe to read `window` here because the dialog body only exists once
  // someone has opened it, which the server never does.
  const url = open ? `${window.location.origin}/clubs/${clubId}/join` : "";

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be refused; the field is selectable either way.
      toast.error(dict.clubs.inviteCopyFailed);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="mr-1 h-4 w-4" />
        {dict.clubs.inviteAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.clubs.inviteTitle}</DialogTitle>
          <DialogDescription>{dict.clubs.inviteSubtitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="club-invite-link">{dict.clubs.inviteLinkLabel}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="club-invite-link"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" variant="outline" onClick={onCopy}>
              {copied ? (
                <Check className="mr-1 h-4 w-4" />
              ) : (
                <Copy className="mr-1 h-4 w-4" />
              )}
              {copied ? dict.clubs.inviteCopied : dict.clubs.inviteCopy}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            {dict.clubs.inviteNotSecret}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
