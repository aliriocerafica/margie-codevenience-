"use client";

import React, { useEffect, useState } from "react";
import { Plus, Package, Download, Filter } from "lucide-react";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import { ProductTable } from "./components/ProductTable";
import AddProductModal from "@/app/product/components/AddProductModal";
import DeleteProductModal from "@/app/product/components/DeleteProductModal";
import EditProductModal from "@/app/product/components/EditProductModal";
import { LOADING_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";
import { useNotifications } from "@/contexts/NotificationContext";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Product = () => {
    const [useBackendData] = useState(true);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [productToEdit, setProductToEdit] = useState<any>(null);
    const { data, error, isLoading, mutate } = useSWR(
        useBackendData ? `/api/product` : null,
        fetcher
    );

    // Enable page highlighting for search results
    usePageHighlight();

    const searchParams = useSearchParams();
    const router = useRouter();

    // Auto-open Add Product modal when arriving with ?add=1
    useEffect(() => {
        const add = searchParams?.get("add");
        if (add === "1") {
            setIsAddProductModalOpen(true);
        }
    }, [searchParams]);

    const productData = data;
    const { lowStockThreshold } = useNotifications();
    const currentError = error;
    const currentLoading = isLoading;

    const handleAddProduct = () => {
        setIsAddProductModalOpen(true);
    };

    const handleProductAdded = (newProduct: any) => {
        // Refresh the product list to show the new product
        mutate();
        console.log("New product added:", newProduct);
    };

    const handleDeleteProduct = (product: any) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleEditProduct = (product: any) => {
        setProductToEdit(product);
        setIsEditModalOpen(true);
    };

    const handleProductDeleted = (productId: string) => {
        // Refresh the product list to remove the deleted product
        mutate();
        console.log("Product deleted:", productId);
    };

    const handleProductUpdated = (updatedProduct: any) => {
        // Refresh the product list to show the updated product
        mutate();
        console.log("Product updated:", updatedProduct);
    };

    const handleExportData = () => {
        console.log("Export product data");
    };

    const handleRetry = () => {
        mutate();
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
                    value={productData?.filter((p: any) => {
                        const stockValue = p?.stock;
                        const stockNum = typeof stockValue === "string" ? parseInt(stockValue, 10) : stockValue ?? 0;
                        return Number.isFinite(stockNum) && stockNum > 0 && stockNum <= lowStockThreshold;
                    }).length || 0}
                    icon={Package}
                    color="yellow"
                />
                <StatCard
                    title="Out of Stock"
                    value={productData?.filter((p: any) => {
                        const stockValue = p?.stock;
                        const stockNum = typeof stockValue === "string" ? parseInt(stockValue, 10) : stockValue ?? 0;
                        return Number.isFinite(stockNum) && stockNum === 0;
                    }).length || 0}
                    icon={Package}
                    color="red"
                />
            </div>

            {/* Products Table */}
            <ProductTable
                data={productData}
                isLoading={currentLoading}
                error={currentError}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
            />

            {/* Add Product Modal */}
            <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => {
                    setIsAddProductModalOpen(false);
                    // Clean up the add query param without full reload
                    try {
                        const params = new URLSearchParams(searchParams?.toString());
                        if (params.has("add")) {
                            params.delete("add");
                            router.replace(`/product${params.toString() ? `?${params.toString()}` : ""}`);
                        }
                    } catch {}
                }}
                onProductAdded={handleProductAdded}
            />

            {/* Delete Product Modal */}
            <DeleteProductModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                product={productToDelete}
                onProductDeleted={handleProductDeleted}
            />

            {/* Edit Product Modal */}
            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={productToEdit}
                onProductUpdated={handleProductUpdated}
            />
        </div>
    );
};

export default Product;