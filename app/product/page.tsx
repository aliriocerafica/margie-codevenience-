"use client";

import React, { useState } from "react";
import { Plus, Package, Download, Filter } from "lucide-react";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import { ProductTable } from "./tables/ProductTable";
import { SAMPLE_PRODUCTS, LOADING_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Product = () => {
    const [useBackendData, setUseBackendData] = useState(false);
    const { data, error, isLoading, mutate } = useSWR(
        useBackendData ? `/api/product` : null, 
        fetcher
    );
    
    // Enable page highlighting for search results
    usePageHighlight();

    // Use sample data if not using backend data
    const productData = useBackendData ? data : SAMPLE_PRODUCTS;
    const currentError = useBackendData ? error : null;
    const currentLoading = useBackendData ? isLoading : false;

    const handleAddProduct = () => {
        console.log("Add new product");
        // TODO: Navigate to add product page or open modal
    };

    const handleExportData = () => {
        console.log("Export product data");
        // TODO: Implement export functionality
    };

    const handleRetry = () => {
        if (useBackendData) {
            mutate();
        }
    };

    if (currentLoading) {
        return <LoadingSpinner message={LOADING_MESSAGES.products} variant="card" />;
    }

    if (currentError) {
        return (
            <ErrorMessage 
              message={ERROR_MESSAGES.products} 
              onRetry={handleRetry}
              variant="card"
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Products"
                description="Manage your product inventory and pricing."
                action={{
                    label: "Add Product",
                    onClick: handleAddProduct,
                    icon: Plus,
                    color: "primary"
                }}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Products"
                    value={productData?.length || 0}
                    icon={Package}
                    color="blue"
                />
                <StatCard
                    title="Available"
                    value={productData?.filter((p: any) => p.status === 'available').length || 0}
                    icon={Package}
                    color="green"
                />
                <StatCard
                    title="Low Stock"
                    value={productData?.filter((p: any) => p.status === 'low_stock').length || 0}
                    icon={Package}
                    color="yellow"
                />
                <StatCard
                    title="Out of Stock"
                    value={productData?.filter((p: any) => p.status === 'out_of_stock').length || 0}
                    icon={Package}
                    color="red"
                />
            </div>

            {/* Products Table */}
            <ProductTable 
                data={productData}
                isLoading={currentLoading}
                error={currentError}
            />
        </div>
    );
};

export default Product;