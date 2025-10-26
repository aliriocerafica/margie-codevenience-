"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Plus, Package, Download, Filter, ScanLine } from "lucide-react";
import useSWR from "swr";
import { usePageHighlight } from "@/hooks/usePageHighlight";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import { ProductTable } from "./components/ProductTable";
import AddProductModal from "@/app/product/components/AddProductModal";
import ScanBarcodePanel from "@/app/product/components/ScanBarcodePanel";
import EditProductModal from "@/app/product/components/EditProductModal";
import { LOADING_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";
import { useNotifications } from "@/contexts/NotificationContext";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Component that uses useSearchParams - needs to be wrapped in Suspense
const ProductWithSearchParams = () => {
    const [useBackendData] = useState(true);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<any>(null);
    const [isScanMode, setIsScanMode] = useState(false);
    const [prefillData, setPrefillData] = useState<any>(null);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
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


    const handleEditProduct = (product: any) => {
        setProductToEdit(product);
        setIsEditModalOpen(true);
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

    const handleStartScanHere = () => {
        setIsScanMode(true);
    };

    const handleScannedFromOFF = (data: { name?: string; imageUrl?: string; brand?: string; gtin?: string; product?: string; quantity?: string; size?: string }) => {
        // Map OFF data to modal fields
        setPrefillData({
            name: data.name || "",
            brand: data.brand || "",
            product: data.product || "",
            quantity: data.quantity || "",
            size: data.size || "",
            price: "",
            unitCost: "",
            stock: "",
            barcode: data.gtin || "",
            image: data.imageUrl || "",
            categoryId: ""
        });
        
        // Close scan modal first, then open add product modal
        setIsScanMode(false);
        setIsProcessingScan(false);
        
        // Small delay to ensure scan modal is fully closed
        setTimeout(() => {
            setIsAddProductModalOpen(true);
        }, 100);
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
                actions={(
                    <Dropdown>
                        <DropdownTrigger>
                            <Button className="bg-gradient-to-r from-[#003366] to-[#004488] text-white">
                                <Plus className="h-4 w-4 mr-2" /> Add product
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Add product options">
                            <DropdownItem key="scan" startContent={<ScanLine className="h-4 w-4" />} onClick={handleStartScanHere}>
                                Scan barcode
                            </DropdownItem>
                            <DropdownItem key="manual" startContent={<Plus className="h-4 w-4" />} onClick={handleAddProduct}>
                                Manual entry
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                )}
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

            {/* Scan Modal */}
            <Modal 
                isOpen={isScanMode} 
                onClose={() => {
                    setIsScanMode(false);
                    setIsProcessingScan(false);
                }} 
                size="lg" 
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-[#003366] dark:text-[#4A90E2]" />
                        <span className="font-semibold">Scan barcode</span>
                    </ModalHeader>
                    <ModalBody>
                        {isScanMode && (
                            <ScanBarcodePanel
                                onResult={async ({ code }) => {
                                    if (isProcessingScan) return; // Prevent duplicate processing
                                    
                                    setIsProcessingScan(true);
                                    try {
                                        // Only use Open Food Facts, skip local DB
                                        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, { cache: 'no-store' });
                                        console.log("[SCAN] OFF Response status:", res.status);
                                        if (res.ok) {
                                            const data = await res.json();
                                            console.log("[SCAN] OFF Response data:", { status: data?.status, hasProduct: !!data?.product });
                                            if (data?.status === 1 && data.product) {
                                                const p = data.product;
                                                const productData = {
                                                    name: p.product_name || p.generic_name || "",
                                                    brand: Array.isArray(p.brands_tags) && p.brands_tags.length ? p.brands_tags[0] : p.brands || "",
                                                    product: p.generic_name || p.product_name || "",
                                                    quantity: "", // Don't fill quantity - this should be for stock count like "1 pc"
                                                    size: p.quantity || "", // Use OpenFoodFacts quantity for size/weight
                                                    imageUrl: p.image_front_small_url || p.image_url || "",
                                                    categories: p.categories_hierarchy || [],
                                                };
                                                
                                                // Log to server terminal
                                                try {
                                                    await fetch("/api/log-scan", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ code, data: productData })
                                                    });
                                                } catch {}
                                                
                                                handleScannedFromOFF({
                                                    name: productData.name,
                                                    brand: productData.brand,
                                                    product: productData.product,
                                                    quantity: productData.quantity,
                                                    size: productData.size,
                                                    imageUrl: productData.imageUrl,
                                                    gtin: code,
                                                });
                                                return;
                                            } else {
                                                console.log("[SCAN] OFF Product not found, status:", data?.status);
                                            }
                                        }
                                    } catch (e) {
                                        console.log("[SCAN] OFF Error:", e);
                                    } finally {
                                        setIsProcessingScan(false);
                                    }
                                    // Fallback: just open manual with barcode prefilled
                                    console.log("[SCAN] Opening manual entry with barcode:", code);
                                    handleScannedFromOFF({ gtin: code });
                                }}
                                onClose={() => {
                                    setIsScanMode(false);
                                    setIsProcessingScan(false);
                                }}
                                isProcessing={isProcessingScan}
                            />
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Products Table */}
            <ProductTable
                data={productData}
                isLoading={currentLoading}
                error={currentError}
                onEdit={handleEditProduct}
            />

            {/* Add Product Modal */}
            <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => {
                    setIsAddProductModalOpen(false);
                    setPrefillData(null);
                    setIsProcessingScan(false); // Reset processing state
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
                initialData={prefillData || undefined}
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

// Main Product component wrapped in Suspense
const Product = () => {
    return (
        <Suspense fallback={<LoadingSpinner message="Loading..." variant="card" />}>
            <ProductWithSearchParams />
        </Suspense>
    );
};

export default Product;