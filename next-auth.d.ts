import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    email?: string | null;
    password?: string | null;
    role?: string | null;
  }

  interface Session {
    user: User & DefaultSession["user"];
    expires: string;
    error: string;
  }
}