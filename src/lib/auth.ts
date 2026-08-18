import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { authConfig } from "@/auth.config";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const client = new MongoClient(process.env.MONGODB_URI!);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(client),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user) return null;

        // Usuario de Google — no tiene contraseña
        if (!user.password) return null;

        // Cuenta bloqueada
        if (user.lockUntil && user.lockUntil > new Date()) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password);

        if (!valid) {
          const attempts = (user.loginAttempts ?? 0) + 1;
          const update: Record<string, unknown> = { loginAttempts: attempts };
          if (attempts >= MAX_ATTEMPTS) {
            update.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
          }
          await User.updateOne({ _id: user._id }, { $set: update });
          return null;
        }

        // Login exitoso: reiniciar contadores
        await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0, lockUntil: null } });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});
