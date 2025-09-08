import "@/styles/globals.css";
import { Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import ConditionalLayout from "@/components/ConditionalLayout";



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
      <body>
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
