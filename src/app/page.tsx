import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Library, Search, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/utils";

export default async function Home() {
  const [session, dict] = await Promise.all([auth(), getDictionary()]);
  if (session?.user) redirect("/dashboard");

  const features = [
    {
      icon: Library,
      title: dict.landing.featureShelvesTitle,
      body: dict.landing.featureShelvesBody,
      href: "/books",
    },
    {
      icon: Search,
      title: dict.landing.featureSearchTitle,
      body: dict.landing.featureSearchBody,
      href: "/books/search",
    },
    {
      icon: Users,
      title: dict.landing.featureClubsTitle,
      body: dict.landing.featureClubsBody,
      href: "/clubs",
    },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-lg font-semibold"
        >
          <BookOpen className="h-5 w-5 self-center" />
          {dict.brand}
          <span className="text-muted-foreground hidden text-xs font-normal italic sm:inline">
            · {dict.tagline}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            {dict.landing.signIn}
          </Link>
          <Link href="/signup" className={cn(buttonVariants())}>
            {dict.landing.getStarted}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {dict.landing.headline}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">
          {dict.landing.blurb}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
            {dict.landing.cta}
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            {dict.landing.ctaSecondary}
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              // These all sit behind auth; prefetching them from the public
              // landing page just triggers a server-side "Not authenticated".
              prefetch={false}
              className="bg-card text-card-foreground focus-visible:ring-ring block rounded-lg border p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
            >
              <f.icon className="text-muted-foreground mb-3 h-5 w-5" />
              <h2 className="text-sm font-semibold">{f.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{f.body}</p>
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-xs">
        {dict.landing.builtOn}
      </footer>
    </div>
  );
}
