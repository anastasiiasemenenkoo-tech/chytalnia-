import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { LoginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        // Accounts created via Google have no password to check against.
        if (!user || !user.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),
    Google,
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Overrides the edge-safe base jwt callback: Google sign-ins need a
    // Prisma round-trip (find-or-create the local User row this app's
    // foreign keys point at), which can't run in proxy.ts's edge runtime.
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email! },
            update: {},
            create: {
              email: user.email!,
              name: user.name ?? null,
              hashedPassword: null,
            },
          });
          token.id = dbUser.id;
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
  },
});
