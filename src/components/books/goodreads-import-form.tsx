"use client";

import { useActionState } from "react";

import { importGoodreadsCsv } from "@/actions/goodreads-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { interpolate } from "@/i18n/interpolate";
import { useDict } from "@/i18n/provider";

export function GoodreadsImportForm() {
  const [state, action, pending] = useActionState(
    importGoodreadsCsv,
    undefined,
  );
  const dict = useDict();

  return (
    <form action={action} className="space-y-4">
      <Input type="file" name="file" accept=".csv,text/csv" required />
      <Button type="submit" disabled={pending}>
        {pending ? dict.books.importSubmitting : dict.books.importSubmit}
      </Button>
      {state && !state.ok && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {interpolate(dict.books.importSuccess, {
            imported: state.imported,
            skipped: state.skipped,
          })}
        </p>
      )}
    </form>
  );
}
