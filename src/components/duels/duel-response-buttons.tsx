"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { cancelDuel, respondToDuel } from "@/actions/duels";
import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

export function DuelResponseButtons({ duelId }: { duelId: string }) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function respond(accept: boolean) {
    const formData = new FormData();
    formData.set("duelId", duelId);
    formData.set("accept", String(accept));
    startTransition(async () => {
      const res = await respondToDuel(formData);
      if (res.ok) {
        toast.success(accept ? dict.duels.accepted : dict.duels.declined);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={() => respond(true)} disabled={pending}>
        {dict.duels.accept}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => respond(false)}
        disabled={pending}
      >
        {dict.duels.decline}
      </Button>
    </div>
  );
}

export function DuelCancelButton({ duelId }: { duelId: string }) {
  const [pending, startTransition] = useTransition();
  const dict = useDict();

  function onClick() {
    const formData = new FormData();
    formData.set("duelId", duelId);
    startTransition(async () => {
      const res = await cancelDuel(formData);
      if (res.ok) toast.success(dict.duels.cancelled);
      else toast.error(res.error);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={pending}
    >
      {dict.duels.cancel}
    </Button>
  );
}
