import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { GoodreadsImportForm } from "@/components/books/goodreads-import-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n";

// Cover lookups make one Open Library request per book — large libraries can
// take a while, so give this route (and the server action it invokes) more
// room than the Vercel default.
export const maxDuration = 60;

export default async function GoodreadsImportPage() {
  const dict = await getDictionary();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/books"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2",
        })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {dict.books.title}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.books.importTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {dict.books.importSubtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.books.importHowToTitle}</CardTitle>
          <CardDescription className="whitespace-pre-line">
            {dict.books.importHowToBody}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoodreadsImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
