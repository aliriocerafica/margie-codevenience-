"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

interface ConditionalLayoutProps {
    children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname();
    
    // Pages that should not have the sidebar
    const noSidebarPages = ["/", "/signup", "/sign-in"];
    
    if (noSidebarPages.includes(pathname)) {
        return <>{children}</>;
    }
    
    return <Sidebar>{children}</Sidebar>;
}
