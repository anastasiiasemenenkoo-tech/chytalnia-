"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/actions/auth";
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

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    undefined,
  );
  const dict = useDict();

  if (state?.sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{dict.auth.forgotPasswordTitle}</CardTitle>
          <CardDescription>{dict.auth.forgotPasswordSent}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-foreground text-sm underline">
            {dict.auth.backToLogin}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.auth.forgotPasswordTitle}</CardTitle>
        <CardDescription>{dict.auth.forgotPasswordSubtitle}</CardDescription>
      </CardHeader>
      <form action={action} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{dict.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.values?.email ?? ""}
              required
            />
            {state?.errors?.email?.[0] && (
              <p className="text-destructive text-sm">
                {state.errors.email[0]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? dict.auth.forgotPasswordSubmitting
              : dict.auth.forgotPasswordSubmit}
          </Button>
          <Link
            href="/login"
            className="text-muted-foreground text-sm underline"
          >
            {dict.auth.backToLogin}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
