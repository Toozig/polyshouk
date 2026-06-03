import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeUsername, usernameSchema } from "@/lib/validation/username";

const loginSchema = z.object({
  username: usernameSchema,
  /** Trim ends only — avoids failed logins from accidental paste whitespace */
  password: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1)
  ),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const username = normalizeUsername(parsed.data.username);
        const user = await prisma.user.findUnique({
          where: { username },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id) return session;
      session.user.id = token.id as string;
      session.user.name = token.name as string | null | undefined;
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true, isPremium: true },
      });
      if (dbUser) {
        (session.user as { role?: string }).role = dbUser.role;
        session.user.isPremium = dbUser.isPremium;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
