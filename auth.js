import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth, update } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!res.ok) return null;

        const user = await res.json();
        return user ? { id: user.id, email: user.email, role: user.role } : null;
      },
    }),
  ],
  pages: { signIn: "/account/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    async session({ session, token }) {
      session.user = { id: token.id, email: token.email, role: token.role };
      return session;
    },
  },
});
