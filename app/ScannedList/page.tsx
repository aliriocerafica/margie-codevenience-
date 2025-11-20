"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScanPanel } from "./sections/ScanPanel";
import { ReceiptPanel } from "./sections/ReceiptPanel";
import { SAMPLE_PRODUCTS } from "@/lib/constants";
import type { ScannedProduct } from "./components/ScannedProductsTable";
import useSWR from "swr";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

export default function POSPage() {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<ScannedProduct[]>([]);
    const [currentQuantities, setCurrentQuantities] = useState<Map<string, number>>(new Map());
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [productToRemove, setProductToRemove] = useState<{ id: string; name: string } | null>(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

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

    const showNotification = ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' | 'warning' }) => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
            type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                : type === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300'
                    : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
        }`;

        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    ${type === 'success'
                ? '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
                : type === 'warning'
                    ? '<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
                    : '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
            }
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-sm">${title}</h4>
                    <p class="text-sm mt-1">${description}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    };

    const addOrIncrementBy = async (p: { id: string; name: string; barcode: string; price: string | number; status?: string; stock?: number }) => {
        // Prevent adding out of stock products
        if (p.status === "out_of_stock") {
            showNotification({
                title: 'Out of Stock',
                description: `"${p.name}" is out of stock and cannot be added to cart.`,
                type: 'error'
            });
            return;
        }

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
                // Show warning for low stock products
                if (p.status === "low_stock") {
                    showNotification({
                        title: 'Low Stock Warning',
                        description: `"${p.name}" is running low on stock (${p.stock || 0} remaining).`,
                        type: 'warning'
                    });
                }

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
        // Prevent adding out of stock products
        if (p.status === "out_of_stock") {
            showNotification({
                title: 'Out of Stock',
                description: `"${p.name}" is out of stock and cannot be added to cart.`,
                type: 'error'
            });
            setQuery("");
            return;
        }

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
                // Show warning for low stock products
                if (p.status === "low_stock") {
                    showNotification({
                        title: 'Low Stock Warning',
                        description: `"${p.name}" is running low on stock.`,
                        type: 'warning'
                    });
                }

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

    const handleClear = () => {
        // Show confirmation modal
        setIsClearModalOpen(true);
    };

    const handleClearSilent = async () => {
        // Clear without confirmation (used after void/checkout)
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

    const confirmClear = async () => {
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE'
            });

            if (response.ok) {
                mutate(); // Refresh cart data
                setIsClearModalOpen(false);
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
    
    const handleRemove = (id: string) => {
        // Find the product details for the modal
        const product = items.find(item => item.id === id);
        if (product) {
            setProductToRemove({ id: product.id, name: product.name });
            setIsRemoveModalOpen(true);
        }
    };

    const confirmRemove = async () => {
        if (!productToRemove) return;

        try {
            // Find the cart item ID for this product
            const cartItem = cartItems?.find((item: any) => item.product.id === productToRemove.id);
            if (cartItem) {
                const response = await fetch(`/api/cart/${cartItem.id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    mutate(); // Refresh cart data
                    setIsRemoveModalOpen(false);
                    setProductToRemove(null);
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
                    <ReceiptPanel items={items} onClearItems={handleClear} onClearItemsSilent={handleClearSilent} />
                </div>
            </div>

            {/* Remove Product Confirmation Modal */}
            <Modal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} size="md">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold">Remove Product</h3>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-gray-100">{productToRemove?.name}</span> from the cart?
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => setIsRemoveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={confirmRemove}>
                            Remove
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Clear Cart Confirmation Modal */}
            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} size="md">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold">Clear Cart</h3>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Are you sure you want to clear all items from the cart? This action cannot be undone.
                        </p>
                        {items.length > 0 && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    This will remove <span className="font-semibold text-gray-900 dark:text-gray-100">{items.length}</span> {items.length === 1 ? 'item' : 'items'} from your cart.
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => setIsClearModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={confirmClear}>
                            Clear All
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}


