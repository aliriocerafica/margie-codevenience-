"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScanPanel } from "./sections/ScanPanel";
import { ReceiptPanel } from "./sections/ReceiptPanel";
import { SAMPLE_PRODUCTS } from "@/lib/constants";
import type { ScannedProduct } from "./components/ScannedProductsTable";

export default function POSPage() {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<ScannedProduct[]>([]);

    // Load items from localStorage on mount
    useEffect(() => {
        const savedItems = localStorage.getItem('scannedItems');
        if (savedItems) {
            try {
                const parsed = JSON.parse(savedItems);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved items:', e);
            }
        }
    }, []);

    const addOrIncrementBy = (p: { id: string; name: string; barcode: string; price: string | number; status?: string; stock?: number }) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === String(p.id));
            const newItems = existing
                ? prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i)
                : [
                    ...prev,
                    {
                        id: String(p.id),
                        name: p.name,
                        barcode: p.barcode,
                        price: p.price,
                        quantity: 1,
                        status: (p.status ?? "available") as any,
                        stock: p.stock,
                    }
                ];
            
            // Save to localStorage
            localStorage.setItem('scannedItems', JSON.stringify(newItems));
            return newItems;
        });
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

    const handleSelect = (p: { id: string; name: string; barcode?: string; price: string | number; status?: string }) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === String(p.id));
            const newItems = existing
                ? prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i)
                : [
                    ...prev,
                    {
                        id: String(p.id),
                        name: p.name,
                        barcode: p.barcode ?? String(p.id).padStart(12, "0"),
                        price: p.price,
                        quantity: 1,
                        status: (p.status ?? "available") as any,
                    }
                ];
            
            // Save to localStorage
            localStorage.setItem('scannedItems', JSON.stringify(newItems));
            return newItems;
        });
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
        setItems([]);
        localStorage.removeItem('scannedItems');
        localStorage.removeItem('recentScans');
    };
    
    const handleIncrease = (id: string) => {
        setItems(prev => {
            const newItems = prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
            localStorage.setItem('scannedItems', JSON.stringify(newItems));
            return newItems;
        });
    };
    
    const handleDecrease = (id: string) => {
        setItems(prev => {
            const newItems = prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i);
            localStorage.setItem('scannedItems', JSON.stringify(newItems));
            return newItems;
        });
    };
    
    const handleRemove = (id: string) => {
        setItems(prev => {
            const newItems = prev.filter(i => i.id !== id);
            localStorage.setItem('scannedItems', JSON.stringify(newItems));
            return newItems;
        });
    };

    const handleQuantityChange = (id: string, quantity: number) => {
        setItems(prev => {
            const newItems = prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i);
            localStorage.setItem('scannedItems', JSON.stringify(newItems));
            return newItems;
        });
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


