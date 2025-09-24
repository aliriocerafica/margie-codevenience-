"use client";

import React, { useMemo, useState } from "react";
import { ReceiptSummary } from "../components/ReceiptSummary";
import { ScannedProduct } from "../components/ScannedProductsTable";
import { printReceipt } from "../utils/printReceipt";

export type ReceiptPanelProps = {
    items: ScannedProduct[];
    onClearItems: () => void;
};

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({ items, onClearItems }) => {
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(12);

    const toNumber = (value: string | number): number => {
        if (typeof value === "number") return value;
        const cleaned = value.replace(/[^0-9.]/g, "");
        const num = parseFloat(cleaned);
        return Number.isFinite(num) ? num : 0;
    };

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const unit = toNumber(item.price);
            return sum + unit * item.quantity;
        }, 0);
    }, [items]);

    const handleCheckout = () => {
        const taxAmount = (Math.max(0, subtotal - discount) * taxRate) / 100;
        const total = Math.max(0, subtotal - discount) + taxAmount;

        printReceipt({
            storeName: "Margie CodeVenience",
            storePhone: "",
            storeAddressLines: [],
            logoPath: "/Logo.png",
            items: items.map((i) => ({
                name: i.name,
                barcode: i.barcode,
                price: toNumber(i.price),
                quantity: i.quantity,
            })),
            subtotal,
            discount,
            taxAmount,
            total,
            timestamp: new Date(),
        });
    };

    const handleClear = () => {
        onClearItems();
        setDiscount(0);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Discount (₱)</label>
                    <input 
                        type="number" 
                        className="w-32 h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3"
                        value={discount}
                        onChange={e => setDiscount(Math.max(0, Number(e.target.value || 0)))}
                        min={0}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Tax Rate (%)</label>
                    <input 
                        type="number" 
                        className="w-32 h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3"
                        value={taxRate}
                        onChange={e => setTaxRate(Math.max(0, Number(e.target.value || 0)))}
                        min={0}
                    />
                </div>
            </div>

            <ReceiptSummary 
                subtotal={subtotal}
                discount={discount}
                taxRatePercent={taxRate}
                additionalFees={[]}
                onCheckout={handleCheckout}
                onClear={handleClear}
            />
        </div>
    );
};


