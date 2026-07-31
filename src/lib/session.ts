import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Middleware turns most signed-out visits away before they get here, but
    // not all of them: a token can still be valid while the row it points at
    // is gone. Throwing made that a 500, and a 500 answering the RSC request
    // behind a <Link> click is invisible — the router drops the navigation
    // and the page just sits there. A redirect is something it understands.
    redirect("/login");
  }
  return user;
}
