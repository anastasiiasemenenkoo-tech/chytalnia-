"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

export function ProfileForm({
  name,
  email,
}: {
  name: string | null;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.ok) toast.success(dict.account.saved);
      else toast.error(res.error);
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
      <Button type="submit" disabled={pending}>
        {pending ? dict.account.saving : dict.common.save}
      </Button>
    </form>
  );
}
