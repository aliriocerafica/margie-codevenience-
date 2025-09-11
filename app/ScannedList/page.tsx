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

    // Preload a few items from backend products (seed data)
    useEffect(() => {
        let isMounted = true;
        const loadSamples = async () => {
            try {
                const res = await fetch("/api/product");
                if (!res.ok) return;
                const data = await res.json();
                if (!Array.isArray(data)) return;
                if (!isMounted) return;
                // Take first 3 products as initial scanned items
                const samples: ScannedProduct[] = data.slice(0, 3).map((p: any) => ({
                    id: String(p.id),
                    name: p.name,
                    barcode: p.barcode ?? String(p.id).padStart(12, "0"),
                    price: p.price,
                    quantity: 1,
                    status: (p.status ?? "available") as any,
                }));
                if (samples.length) setItems(samples);
            } catch (_) {
                // ignore, fall back to manual add using SAMPLE_PRODUCTS
            }
        };
        loadSamples();
        return () => { isMounted = false; };
    }, []);

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

        setItems(prev => {
            const existing = prev.find(i => i.id === String(found.id));
            if (existing) {
                return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [
                ...prev,
                {
                    id: String(found.id),
                    name: found.name,
                    barcode: found.id.toString().padStart(12, "0"),
                    price: found.price,
                    quantity: 1,
                    status: found.status as any,
                }
            ];
        });
        setQuery("");
    };

    const handleClear = () => setItems([]);
    const handleIncrease = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    const handleDecrease = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
    const handleRemove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Scanned List of Products"
                description="Scan products and generate receipt in real-time."
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <ScanPanel 
                        query={query}
                        onQueryChange={setQuery}
                        onScan={handleScan}
                        items={items}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                        onRemove={handleRemove}
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


