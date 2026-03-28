import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as string;
        token.orgId = user.orgId as string | null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as "SUPER_ADMIN" | "USER";
      session.user.orgId = token.orgId as string | null;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  providers: [], // Providers are added in auth.ts (not here, to avoid Edge Runtime issues)
};
