"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    undefined,
  );
  const dict = useDict();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.auth.resetPasswordTitle}</CardTitle>
        <CardDescription>{dict.auth.resetPasswordSubtitle}</CardDescription>
      </CardHeader>
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{dict.auth.password}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
            />
            {state?.errors?.password?.[0] && (
              <p className="text-destructive text-sm">
                {state.errors.password[0]}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              {dict.auth.passwordHint}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">
              {dict.auth.passwordConfirm}
            </Label>
            <PasswordInput
              id="passwordConfirm"
              name="passwordConfirm"
              autoComplete="new-password"
              required
            />
            {state?.errors?.passwordConfirm?.[0] && (
              <p className="text-destructive text-sm">
                {dict.auth.passwordMismatch}
              </p>
            )}
          </div>
          {state?.errors?._form?.[0] && (
            <p className="text-destructive text-sm">
              {state.errors._form[0]}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? dict.auth.resetPasswordSubmitting
              : dict.auth.resetPasswordSubmit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
