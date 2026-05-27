import Link from "next/link";
import { BookOpen } from "lucide-react";

import { getDictionary } from "@/i18n";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary();
  return (
    <div className="bg-muted/40 flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold"
      >
        <BookOpen className="h-5 w-5" />
        {dict.brand}
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
