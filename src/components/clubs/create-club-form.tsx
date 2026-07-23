"use client";

import { useActionState } from "react";

import { createClubAction } from "@/actions/clubs";
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
import { Textarea } from "@/components/ui/textarea";
import { useDict } from "@/i18n/provider";

export function CreateClubForm() {
  const [state, action, pending] = useActionState(createClubAction, undefined);
  const dict = useDict();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.clubs.createTitle}</CardTitle>
        <CardDescription>{dict.clubs.createSubtitle}</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{dict.clubs.nameLabel}</Label>
            <Input
              id="name"
              name="name"
              placeholder={dict.clubs.namePlaceholder}
              required
            />
            {state?.errors?.name?.[0] && (
              <p className="text-destructive text-sm">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{dict.clubs.descriptionLabel}</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder={dict.clubs.descriptionPlaceholder}
            />
            {state?.errors?.description?.[0] && (
              <p className="text-destructive text-sm">
                {state.errors.description[0]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={pending}>
            {pending ? dict.clubs.creating : dict.clubs.create}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
