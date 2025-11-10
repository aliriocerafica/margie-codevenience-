import "@/styles/globals.css";
import { Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { Poppins } from "next/font/google";
import type { Metadata } from 'next'

import { Providers } from "./providers";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import SearchModal from "@/components/SearchModal";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: 'Margie CodeVenience',
}

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
    <html suppressHydrationWarning lang="en" className={poppins.variable}>
      <head />
      <body className={`bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-poppins ${poppins.className}`}>
        <Providers themeProps={{ attribute: "class", defaultTheme: "system" }}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <SearchModal />
        </Providers>
      </body>
    </html>
  );
}
