"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { cancelEmailChange, updateProfile } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { interpolate, useDict } from "@/i18n/provider";

export function ProfileForm({
  name,
  email,
  pendingEmail,
}: {
  name: string | null;
  email: string;
  /** An address asked for but not yet confirmed — it isn't on the account. */
  pendingEmail: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.pendingEmail
          ? interpolate(dict.account.emailPendingToast, {
              email: res.pendingEmail,
            })
          : dict.account.saved,
      );
      // The pending note below is rendered on the server.
      router.refresh();
    });
  }

  function onCancelChange() {
    startTransition(async () => {
      await cancelEmailChange();
      toast.success(dict.account.emailPendingCancelled);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="account-name">{dict.account.nameLabel}</Label>
        <Input
          id="account-name"
          name="name"
          defaultValue={name ?? ""}
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-email">{dict.account.emailLabel}</Label>
        <Input
          id="account-email"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
        />
        <p className="text-muted-foreground text-xs">
          {dict.account.emailHint}
        </p>
      </div>

      {pendingEmail && (
        <div className="bg-muted/60 space-y-2 rounded-lg p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <MailCheck className="h-4 w-4 shrink-0" />
            {interpolate(dict.account.emailPendingNote, {
              email: pendingEmail,
            })}
          </p>
          <p className="text-muted-foreground text-xs">
            {dict.account.emailPendingHint}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelChange}
            disabled={pending}
          >
            {dict.account.emailPendingCancel}
          </Button>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? dict.account.saving : dict.common.save}
      </Button>
    </form>
  );
}
