import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { store: true },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          storeId: user.store?.id ?? null,
          storeSlug: user.store?.slug ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/entrar",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { store: { select: { id: true, slug: true } } },
        });
        token.storeId = dbUser?.store?.id ?? null;
        token.storeSlug = dbUser?.store?.slug ?? null;
        if (user) {
          token.name = user.name;
          token.email = user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.storeId = (token.storeId as string | null) ?? null;
        session.user.storeSlug = (token.storeSlug as string | null) ?? null;
      }
      return session;
    },
  },
});
