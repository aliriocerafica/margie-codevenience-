"use client";

import React, { useState } from "react";
import { Plus, Tag, Grid, TrendingUp } from "lucide-react";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import { CategoryTable } from "./tables/CategoryTable";
import { LOADING_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Category = () => {
    const [useBackendData] = useState(true);
    const { data, error, isLoading, mutate } = useSWR(
        useBackendData ? `/api/category` : null, 
        fetcher
    );
    
    // Enable page highlighting for search results
    usePageHighlight();

    const categoryData = data;
    const currentError = error;
    const currentLoading = isLoading;

    const handleAddCategory = () => {
        console.log("Add new category");
    };

    const handleRetry = () => {
        mutate();
    };

    // Calculate stats
    const totalCategories = categoryData?.length || 0;
    const activeCategories = categoryData?.filter((c: any) => c.status === 'active').length || 0;
    const totalProducts = categoryData?.reduce((sum: number, c: any) => sum + (c.productCount || 0), 0) || 0;
    const avgProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;

    if (currentLoading) {
        return <LoadingSpinner message={LOADING_MESSAGES.categories} variant="card" />;
    }

    if (currentError) {
        return (
            <ErrorMessage 
              message={ERROR_MESSAGES.categories} 
              onRetry={handleRetry}
              variant="card"
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Categories"
                description="Organize your products into categories for better management."
                action={{
                    label: "Add Category",
                    onClick: handleAddCategory,
                    icon: Plus,
                    color: "primary"
                }}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Categories"
                    value={totalCategories}
                    icon={Tag}
                    color="blue"
                />
                <StatCard
                    title="Active"
                    value={activeCategories}
                    icon={Tag}
                    color="green"
                />
                <StatCard
                    title="Total Products"
                    value={totalProducts}
                    icon={Grid}
                    color="purple"
                />
                <StatCard
                    title="Avg Products"
                    value={avgProductsPerCategory}
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Categories Table */}
            <CategoryTable 
                data={categoryData}
                isLoading={currentLoading}
                error={currentError}
            />
        </div>
    );
};

export default Category;