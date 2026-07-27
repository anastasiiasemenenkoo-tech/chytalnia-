"use client";

import { useTransition } from "react";
import { Swords } from "lucide-react";
import { toast } from "sonner";

import { challengeToDuel } from "@/actions/duels";
import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

export function ChallengeButton({
  clubId,
  opponentId,
}: {
  clubId: string;
  opponentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onClick() {
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("opponentId", opponentId);
    startTransition(async () => {
      const res = await challengeToDuel(formData);
      if (res.ok) toast.success(dict.clubs.challengeSent);
      else toast.error(res.error);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={onClick}
      disabled={pending}
    >
      <Swords />
      {dict.clubs.challenge}
    </Button>
  );
}
