"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "./widgets/DashboardStats";
import { DashboardQuickActions } from "./widgets/DashboardQuickActions";
import { DashboardRecentProducts } from "./widgets/DashboardRecentProducts";
import { 
  DASHBOARD_STATS, 
  DASHBOARD_QUICK_ACTIONS, 
  RECENT_PRODUCTS 
} from "@/lib/constants";

export default function DashboardPage() {
    const router = useRouter();
    
    // Enable page highlighting for search results
    usePageHighlight();

    const handlePageClick = () => {
        router.push("/");
    };

    return (
        <div className="space-y-6" onClick={handlePageClick}>
            {/* Header */}
            <PageHeader 
                title="Dashboard"
                description="Welcome to Margie CodeVenience POS System"
            />

            {/* Stats Grid */}
            <DashboardStats stats={DASHBOARD_STATS} />

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardRecentProducts products={RECENT_PRODUCTS} />
                <DashboardQuickActions actions={DASHBOARD_QUICK_ACTIONS} />
            </div>
        </div>
    );
}
