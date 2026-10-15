import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "./db";
import { User } from "@/models/User";
import { Store } from "@/models/Store";

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

        await connectDB();
        const user = await User.findOne({
          email: parsed.data.email.toLowerCase(),
        }).lean();
        if (!user) return null;

        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!ok) return null;

        const store = await Store.findOne({ userId: user._id })
          .select("_id slug")
          .lean();

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          storeId: store ? String(store._id) : null,
          storeSlug: store?.slug ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/entrar",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (
        typeof token.exp === "number" &&
        token.exp * 1000 <= Date.now()
      ) {
        return null;
      }
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id as string).lean();
        if (!dbUser) return null;
        const store = await Store.findOne({ userId: dbUser._id })
          .select("_id slug")
          .lean();
        token.storeId = store ? String(store._id) : null;
        token.storeSlug = store?.slug ?? null;
        token.name = user?.name ?? dbUser.name;
        token.email = user?.email ?? dbUser.email;
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
