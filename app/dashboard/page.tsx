"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { useNotifications } from "@/contexts/NotificationContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardStats } from "./widgets/DashboardStats";
import { DashboardQuickActions } from "./widgets/DashboardQuickActions";
import { DashboardLowStockProducts } from "./widgets/DashboardLowStockProducts";
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

	// Get low stock threshold from NotificationContext
	const { lowStockThreshold } = useNotifications();

	const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR<{ products: number; categories: number; users: number; todaySales: number; salesGrowth: number }>(
		"/api/dashboard", 
		fetcher,
		{
			refreshInterval: 5000,
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
		}
	);
	
	// Fetch recent products
	const { data: recentProductsData, error: productsError, isLoading: productsLoading } = useSWR<any[]>(
		"/api/product", 
		fetcher,
		{
			refreshInterval: 5000,
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
		}
	);
	
	// Fetch low stock products using the stock-alerts API
	const { data: stockAlertsData, error: stockAlertsError, isLoading: stockAlertsLoading } = useSWR<any>(
		lowStockThreshold ? `/api/products/stock-alerts?threshold=${lowStockThreshold}` : null,
		fetcher,
		{
			refreshInterval: 5000,
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
		}
	);

    // Removed global click navigation that interfered with in-page links

	// Map stats to widget shape
	const stats: DashboardStat[] = React.useMemo(() => {
		if (!statsData) return [
			{ title: "Total Products", value: "-", change: "", changeType: "neutral", icon: Package },
			{ title: "Categories", value: "-", change: "", changeType: "neutral", icon: Tag },
			{ title: "Today's Sales", value: "₱0", change: "", changeType: "neutral", icon: DollarSign },
			{ title: "Active Users", value: "-", change: "", changeType: "neutral", icon: Users }
		];
		
		const salesChangeType = statsData.salesGrowth > 0 ? "positive" : statsData.salesGrowth < 0 ? "negative" : "neutral";
		const salesChange = statsData.salesGrowth !== 0 ? `${statsData.salesGrowth >= 0 ? '+' : ''}${statsData.salesGrowth}%` : "0%";
		
		return [
			{ title: "Total Products", value: String(statsData.products), change: "", changeType: "neutral", icon: Package },
			{ title: "Categories", value: String(statsData.categories), change: "", changeType: "neutral", icon: Tag },
			{ title: "Today's Sales", value: `₱${statsData.todaySales.toLocaleString()}`, change: `${salesChange} vs yesterday`, changeType: salesChangeType, icon: DollarSign },
			{ title: "Active Users", value: String(statsData.users), change: "", changeType: "neutral", icon: Users }
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

	// Map low stock products to widget shape
	const lowStockProducts: ProductSummaryItem[] = React.useMemo(() => {
		if (!stockAlertsData?.alerts?.lowStock) return [];
		return stockAlertsData.alerts.lowStock.map((p: any) => ({
			id: p.id,
			name: p.name,
			category: p.category ?? "Unknown",
			price: p.price,
			stock: p.stock,
			status: "low_stock"
		}));
	}, [stockAlertsData]);

    return (
        <div className="space-y-6">
			{/* Header */}
			<PageHeader 
				title="Dashboard"
				description="Welcome to Margie CodeVenience System"
			/>

			{/* Stats Grid */}
			{statsLoading && <div className="text-sm text-gray-500">Loading dashboard...</div>}
			{statsError && <div className="text-sm text-red-600">Failed to load dashboard data.</div>}
			<DashboardStats stats={stats} />

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{stockAlertsLoading ? (
					<div className="text-sm text-gray-500 p-4">Loading low stock products...</div>
				) : stockAlertsError ? (
					<div className="text-sm text-red-600 p-4">Failed to load low stock products.</div>
				) : (
					<DashboardLowStockProducts products={lowStockProducts} />
				)}
				{productsLoading ? (
					<div className="text-sm text-gray-500 p-4">Loading products...</div>
				) : productsError ? (
					<div className="text-sm text-red-600 p-4">Failed to load recent products.</div>
				) : (
					<DashboardRecentProducts products={recentProducts} />
				)}
				<DashboardQuickActions actions={DASHBOARD_QUICK_ACTIONS} />
			</div>
		</div>
	);
}
