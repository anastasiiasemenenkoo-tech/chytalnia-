import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Library, Search, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n";

export default async function Home() {
  const [session, dict] = await Promise.all([auth(), getDictionary()]);
  if (session?.user) redirect("/dashboard");

  const features = [
    {
      icon: Library,
      title: dict.landing.featureShelvesTitle,
      body: dict.landing.featureShelvesBody,
    },
    {
      icon: Search,
      title: dict.landing.featureSearchTitle,
      body: dict.landing.featureSearchBody,
    },
    {
      icon: Users,
      title: dict.landing.featureClubsTitle,
      body: dict.landing.featureClubsBody,
    },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-5 w-5" />
          {dict.brand}
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            {dict.landing.signIn}
          </Link>
          <Link href="/signup" className={buttonVariants()}>
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
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            {dict.landing.cta}
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {dict.landing.ctaSecondary}
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card text-card-foreground rounded-lg border p-6 text-left"
            >
              <f.icon className="text-muted-foreground mb-3 h-5 w-5" />
              <h2 className="text-sm font-semibold">{f.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-xs">
        {dict.landing.builtOn}
      </footer>
    </div>
  );
}
