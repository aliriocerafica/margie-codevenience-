"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "./widgets/DashboardStats";
import { DashboardQuickActions } from "./widgets/DashboardQuickActions";
import { DashboardRecentProducts } from "./widgets/DashboardRecentProducts";
import { 
  DASHBOARD_QUICK_ACTIONS
} from "@/lib/constants";
import { Package, Tag, Users, DollarSign } from "lucide-react";
import type { DashboardStat, ProductSummaryItem } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => {
	if (!res.ok) throw new Error("Failed to fetch");
	return res.json();
});

export default function DashboardPage() {
	const router = useRouter();
	
	// Enable page highlighting for search results
	usePageHighlight();

	const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR<{ products: number; orders: number; users: number }>("/api/dashboard", fetcher);
	const { data: recentProductsData, error: productsError, isLoading: productsLoading } = useSWR<any[]>("/api/product", fetcher);

    // Removed global click navigation that interfered with in-page links

	// Map stats to widget shape
	const stats: DashboardStat[] = React.useMemo(() => {
		if (!statsData) return [
			{ title: "Total Products", value: "-", change: "", changeType: "neutral", icon: Package },
			{ title: "Categories", value: "-", change: "", changeType: "neutral", icon: Tag },
			{ title: "Total Sales", value: "₱0", change: "", changeType: "neutral", icon: DollarSign },
			{ title: "Active Users", value: "-", change: "", changeType: "neutral", icon: Users }
		];
		return [
			{ title: "Total Products", value: String(statsData.products), change: "+0%", changeType: "neutral", icon: Package },
			{ title: "Categories", value: String(statsData.orders), change: "+0%", changeType: "neutral", icon: Tag },
			{ title: "Total Sales", value: "₱0", change: "+0%", changeType: "neutral", icon: DollarSign },
			{ title: "Active Users", value: String(statsData.users), change: "+0%", changeType: "neutral", icon: Users }
		];
	}, [statsData]);

	// Map products to widget shape (limit to 5 most recent)
	const recentProducts: ProductSummaryItem[] = React.useMemo(() => {
		if (!recentProductsData) return [];
		return recentProductsData.slice(0, 5).map((p: any) => ({
			id: p.id,
			name: p.name,
			category: p.category?.name ?? "Unknown",
			price: p.price,
			stock: parseInt(p.stock ?? "0"),
			status: p.status
		}));
	}, [recentProductsData]);

    return (
        <div className="space-y-6">
			{/* Header */}
			<PageHeader 
				title="Dashboard"
				description="Welcome to Margie CodeVenience POS System"
			/>

			{/* Stats Grid */}
			{statsLoading && <div className="text-sm text-gray-500">Loading dashboard...</div>}
			{statsError && <div className="text-sm text-red-600">Failed to load dashboard data.</div>}
			<DashboardStats stats={stats} />

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{productsLoading && <div className="text-sm text-gray-500">Loading products...</div>}
				{productsError && <div className="text-sm text-red-600">Failed to load recent products.</div>}
				<DashboardRecentProducts products={recentProducts} />
				<DashboardQuickActions actions={DASHBOARD_QUICK_ACTIONS} />
			</div>
		</div>
	);
}
