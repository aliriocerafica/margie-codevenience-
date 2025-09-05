import "@/styles/globals.css";
import { Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import { ThemeSwitch } from '@/components/ThemeSwitch';



export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div>
            <div className="fixed top-4 right-4 z-50">
              <ThemeSwitch />
            </div>
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
