"use client";

import Link from "next/link";
import { useActionState } from "react";

import { confirmEmailChangeAction } from "@/actions/account";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { interpolate, useDict } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * A button rather than a bare link: opening a mailbox shouldn't be enough to
 * move an account. Link scanners and prefetchers issue GETs, and a Server
 * Action only answers a POST.
 */
export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    confirmEmailChangeAction,
    undefined,
  );
  const dict = useDict();

  if (state?.ok && state.email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{dict.account.confirmTitle}</CardTitle>
          <CardDescription>
            {interpolate(dict.account.confirmDone, { email: state.email })}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ className: "w-full" }))}
          >
            {dict.account.confirmDoneHome}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.account.confirmTitle}</CardTitle>
        <CardDescription>{dict.account.confirmSubtitle}</CardDescription>
      </CardHeader>
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        {state?.error && (
          <CardContent>
            <p className="text-destructive text-sm">{state.error}</p>
          </CardContent>
        )}
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? dict.account.confirmSubmitting
              : dict.account.confirmSubmit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
