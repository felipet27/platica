import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Configuración edge-compatible: sin Mongoose ni MongoClient
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize() {
        return null; // La validación real ocurre en src/lib/auth.ts
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isPublic =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/api/auth") ||
        pathname === "/manifest.webmanifest" ||
        pathname.startsWith("/api/icons/") ||
        pathname === "/sw.js";

      if (!isLoggedIn && !isPublic) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
};
