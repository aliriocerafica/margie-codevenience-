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
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/sign-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });

          if (!res.ok) {
            const errorData = await res.json();
            // Throw error with message for next-auth to catch
            throw new Error(errorData.error || 'Invalid credentials');
          }

          const user = await res.json();
          return user ? { id: user.id, email: user.email, role: user.role } : null;
        } catch (error) {
          // Re-throw the error so next-auth can handle it
          throw error;
        }
      },
    }),
  ],
  pages: { signIn: "/" },
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
