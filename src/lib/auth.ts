import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { authConfig } from "@/auth.config";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const client = new MongoClient(process.env.MONGODB_URI!);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(client),
  session: { strategy: "jwt" },
  providers: [
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

        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;

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
