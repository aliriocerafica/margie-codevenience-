"use client";

import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import FloatingTopNav from "./FloatingTopNav";
import FloatingNotificationButton from "./FloatingNotificationButton";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Pages that should not have the sidebar
  const noSidebarPages = ["/", "/signup", "/sign-in", "/forgot-password", "/reset-password"];

  if (noSidebarPages.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <FloatingTopNav />
      <FloatingNotificationButton />
      <Sidebar>{children}</Sidebar>
    </>
  );
}
