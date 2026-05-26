import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Library, Search, Users } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";

const FEATURES = [
  {
    icon: Library,
    title: "Three shelves",
    description: "Track what you want to read, what you're reading, and what you've finished.",
  },
  {
    icon: Search,
    title: "Open Library search",
    description: "Find any book by title or author. Covers come along for free.",
  },
  {
    icon: Users,
    title: "Book clubs",
    description: "Join a club or start your own, then pick what everyone's reading.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-5 w-5" />
          Bookshelf
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Get started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Your reading life, in one tidy shelf.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">
          Keep a personal log of what you&apos;ve read, what you&apos;re reading, and
          what&apos;s next. Join book clubs and see what everyone&apos;s into.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Create your bookshelf
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card text-card-foreground rounded-lg border p-6 text-left"
            >
              <f.icon className="text-muted-foreground mb-3 h-5 w-5" />
              <h2 className="text-sm font-semibold">{f.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-xs">
        Built on Next.js 16 · Auth.js · Prisma · Tailwind v4 · shadcn/ui
      </footer>
    </div>
  );
}
