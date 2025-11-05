"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScanPanel } from "./sections/ScanPanel";
import { ReceiptPanel } from "./sections/ReceiptPanel";
import { SAMPLE_PRODUCTS } from "@/lib/constants";
import type { ScannedProduct } from "./components/ScannedProductsTable";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

export default function POSPage() {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<ScannedProduct[]>([]);
    const [currentQuantities, setCurrentQuantities] = useState<Map<string, number>>(new Map());

    // Load items from database via API
    const { data: cartItems, error, isLoading, mutate } = useSWR('/api/cart', fetcher, {
        refreshInterval: 2000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 500,
    });

    // Transform cart items to ScannedProduct format
    useEffect(() => {
        if (cartItems && Array.isArray(cartItems)) {
            const transformedItems: ScannedProduct[] = cartItems.map((item: any) => {
                const baseQuantity = item.quantity;
                const currentQuantity = currentQuantities.get(item.product.id);
                const finalQuantity = currentQuantity !== undefined ? currentQuantity : baseQuantity;
                
                return {
                    id: item.product.id,
                    name: item.product.name,
                    barcode: item.product.barcode || item.product.id,
                    price: parseFloat(item.product.price),
                    quantity: finalQuantity,
                    status: item.product.status,
                    stock: parseInt(item.product.stock) || 0,
                    category: item.product.category?.name || 'Unknown'
                };
            });
            setItems(transformedItems);
        }
    }, [cartItems, currentQuantities]);

    // Initialize current quantities when cart items change
    useEffect(() => {
        if (cartItems && Array.isArray(cartItems)) {
            setCurrentQuantities(prev => {
                const newMap = new Map(prev);
                cartItems.forEach((item: any) => {
                    // Always update with the latest server quantity for new items
                    // or if the server quantity is different from our cached quantity
                    const serverQuantity = item.quantity;
                    const cachedQuantity = newMap.get(item.product.id);
                    
                    if (cachedQuantity === undefined || cachedQuantity !== serverQuantity) {
                        newMap.set(item.product.id, serverQuantity);
                    }
                });
                return newMap;
            });
        }
    }, [cartItems]);

    const addOrIncrementBy = async (p: { id: string; name: string; barcode: string; price: string | number; status?: string; stock?: number }) => {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: p.id,
                    quantity: 1
                })
            });

            if (response.ok) {
                // Update current quantities immediately for the added item
                setCurrentQuantities(prev => {
                    const newMap = new Map(prev);
                    const currentQty = newMap.get(p.id) || 0;
                    newMap.set(p.id, currentQty + 1);
                    return newMap;
                });
                mutate(); // Refresh cart data
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
        }
    };

    const handleScan = () => {
        const q = query.trim().toLowerCase();
        if (!q) return;

        const found = SAMPLE_PRODUCTS.find(p =>
            p.id.toString() === q ||
            p.name.toLowerCase().includes(q) ||
            p.category.name.toLowerCase().includes(q)
        );

        if (!found) {
            setQuery("");
            return;
        }

        addOrIncrementBy({
            id: String(found.id),
            name: found.name,
            barcode: found.id.toString().padStart(12, "0"),
            price: found.price,
            status: found.status as any,
        });
        setQuery("");
    };

    const handleSelect = async (p: { id: string; name: string; barcode?: string; price: string | number; status?: string }) => {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: p.id,
                    quantity: 1
                })
            });

            if (response.ok) {
                // Update current quantities immediately for the added item
                setCurrentQuantities(prev => {
                    const newMap = new Map(prev);
                    const currentQty = newMap.get(p.id) || 0;
                    newMap.set(p.id, currentQty + 1);
                    return newMap;
                });
                mutate(); // Refresh cart data
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
        }
        setQuery("");
    };

    const handleSearch = async () => {
        const q = query.trim().toLowerCase();
        if (!q) return;
        try {
            const res = await fetch("/api/product");
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("Invalid products response");

            const match = data.find((p: any) => {
                const idStr = String(p.id).toLowerCase();
                const nameStr = String(p.name ?? "").toLowerCase();
                const categoryStr = String(p.category?.name ?? "").toLowerCase();
                const barcodeStr = String(p.barcode ?? idStr).toLowerCase();
                return idStr === q || barcodeStr === q || nameStr.includes(q) || categoryStr.includes(q);
            });

            if (match) {
                addOrIncrementBy({
                    id: String(match.id),
                    name: match.name,
                    barcode: match.barcode ?? String(match.id).padStart(12, "0"),
                    price: match.price,
                    status: match.status,
                    stock: parseInt(match.stock) || 0,
                });
                setQuery("");
                return;
            }
        } catch (_) {
            // fall through to local sample search
        }

        // Fallback to sample list if API search fails or no match
        const local = SAMPLE_PRODUCTS.find(p =>
            p.id.toString() === q ||
            p.name.toLowerCase().includes(q) ||
            p.category.name.toLowerCase().includes(q)
        );
        if (local) {
            addOrIncrementBy({
                id: String(local.id),
                name: local.name,
                barcode: local.id.toString().padStart(12, "0"),
                price: local.price,
                status: local.status as any,
                stock: local.stock || 0,
            });
        }
        setQuery("");
    };

    const handleClear = async () => {
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE'
            });

            if (response.ok) {
                mutate(); // Refresh cart data
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };
    
    const handleIncrease = async (id: string) => {
        // Update current quantity immediately
        setCurrentQuantities(prev => {
            const newMap = new Map(prev);
            const currentQty = newMap.get(id) || 0;
            newMap.set(id, currentQty + 1);
            return newMap;
        });

        try {
            // Find the cart item ID for this product
            const cartItem = cartItems?.find((item: any) => item.product.id === id);
            if (cartItem) {
                const currentQty = currentQuantities.get(id) || cartItem.quantity;
                const newQuantity = currentQty + 1;
                
                const response = await fetch(`/api/cart/${cartItem.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        quantity: newQuantity
                    })
                });

                if (!response.ok) {
                    // Revert on error
                    setCurrentQuantities(prev => {
                        const newMap = new Map(prev);
                        const currentQty = newMap.get(id) || 0;
                        newMap.set(id, Math.max(0, currentQty - 1));
                        return newMap;
                    });
                    console.error('Failed to update quantity');
                } else {
                    // Sync with server data
                    mutate();
                }
            }
        } catch (error) {
            // Revert on error
            setCurrentQuantities(prev => {
                const newMap = new Map(prev);
                const currentQty = newMap.get(id) || 0;
                newMap.set(id, Math.max(0, currentQty - 1));
                return newMap;
            });
            console.error('Error increasing quantity:', error);
        }
    };
    
    const handleDecrease = async (id: string) => {
        // Update current quantity immediately
        setCurrentQuantities(prev => {
            const newMap = new Map(prev);
            const currentQty = newMap.get(id) || 0;
            newMap.set(id, Math.max(1, currentQty - 1));
            return newMap;
        });

        try {
            // Find the cart item ID for this product
            const cartItem = cartItems?.find((item: any) => item.product.id === id);
            if (cartItem) {
                const currentQty = currentQuantities.get(id) || cartItem.quantity;
                const newQuantity = Math.max(1, currentQty - 1);
                
                const response = await fetch(`/api/cart/${cartItem.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        quantity: newQuantity
                    })
                });

                if (!response.ok) {
                    // Revert on error
                    setCurrentQuantities(prev => {
                        const newMap = new Map(prev);
                        const currentQty = newMap.get(id) || 0;
                        newMap.set(id, currentQty + 1);
                        return newMap;
                    });
                    console.error('Failed to update quantity');
                } else {
                    // Sync with server data
                    mutate();
                }
            }
        } catch (error) {
            // Revert on error
            setCurrentQuantities(prev => {
                const newMap = new Map(prev);
                const currentQty = newMap.get(id) || 0;
                newMap.set(id, currentQty + 1);
                return newMap;
            });
            console.error('Error decreasing quantity:', error);
        }
    };
    
    const handleRemove = async (id: string) => {
        try {
            // Find the cart item ID for this product
            const cartItem = cartItems?.find((item: any) => item.product.id === id);
            if (cartItem) {
                const response = await fetch(`/api/cart/${cartItem.id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    mutate(); // Refresh cart data
                }
            }
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const handleQuantityChange = async (id: string, quantity: number) => {
        const newQuantity = Math.max(1, quantity);
        
        // Update current quantity immediately
        setCurrentQuantities(prev => {
            const newMap = new Map(prev);
            newMap.set(id, newQuantity);
            return newMap;
        });

        try {
            // Find the cart item ID for this product
            const cartItem = cartItems?.find((item: any) => item.product.id === id);
            if (cartItem) {
                const response = await fetch(`/api/cart/${cartItem.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        quantity: newQuantity
                    })
                });

                if (!response.ok) {
                    // Revert on error - get original quantity from cartItems
                    const originalItem = cartItems?.find((item: any) => item.product.id === id);
                    if (originalItem) {
                        setCurrentQuantities(prev => {
                            const newMap = new Map(prev);
                            newMap.set(id, originalItem.quantity);
                            return newMap;
                        });
                    }
                    console.error('Failed to update quantity');
                } else {
                    // Sync with server data
                    mutate();
                }
            }
        } catch (error) {
            // Revert on error
            const originalItem = cartItems?.find((item: any) => item.product.id === id);
            if (originalItem) {
                setCurrentQuantities(prev => {
                    const newMap = new Map(prev);
                    newMap.set(id, originalItem.quantity);
                    return newMap;
                });
            }
            console.error('Error updating quantity:', error);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Product List"
                description="Search product names and build your receipt in real-time."
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <ScanPanel
                        query={query}
                        onQueryChange={setQuery}
                        onScan={handleScan}
                        onSelect={handleSelect}
                        items={items}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                        onRemove={handleRemove}
                        onQuantityChange={handleQuantityChange}
                        onClear={handleClear}
                    />
                </div>
                <div className="xl:col-span-1">
                    <ReceiptPanel items={items} onClearItems={handleClear} />
                </div>
            </div>
        </div>
    );
}


