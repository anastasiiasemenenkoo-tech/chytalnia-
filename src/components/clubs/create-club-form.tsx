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

export function CreateClubForm() {
  const [state, action, pending] = useActionState(createClubAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a book club</CardTitle>
        <CardDescription>
          You&apos;ll be the owner. Members can join from the clubs list.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Sci-Fi Saturday"
              required
            />
            {state?.errors?.name?.[0] && (
              <p className="text-destructive text-sm">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="What's this club about?"
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
            {pending ? "Creating..." : "Create club"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
