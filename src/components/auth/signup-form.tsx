"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction } from "@/actions/auth";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDict } from "@/i18n/provider";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);
  const dict = useDict();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.auth.signupTitle}</CardTitle>
        <CardDescription>{dict.auth.signupSubtitle}</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{dict.auth.name}</Label>
            <Input id="name" name="name" autoComplete="name" required />
            {state?.errors?.name?.[0] && (
              <p className="text-destructive text-sm">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{dict.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            {state?.errors?.email?.[0] && (
              <p className="text-destructive text-sm">
                {state.errors.email[0]}
              </p>
            )}
          </div>
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
            <p className="text-destructive text-sm">{state.errors._form[0]}</p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? dict.auth.submittingSignup : dict.auth.submitSignup}
          </Button>
          <p className="text-muted-foreground text-sm">
            {dict.auth.alreadyHaveAccount}{" "}
            <Link href="/login" className="text-foreground underline">
              {dict.auth.signInLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
