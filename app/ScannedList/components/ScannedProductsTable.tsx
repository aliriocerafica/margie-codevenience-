"use client";

import React from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency } from "@/lib/constants";

export type ScannedProduct = {
    id: string;
    name: string;
    barcode: string;
    price: string | number;
    quantity: number;
    status?: "available" | "low_stock" | "out_of_stock";
};

export type ScannedProductsTableProps = {
    items: ScannedProduct[];
    onIncrease?: (id: string) => void;
    onDecrease?: (id: string) => void;
    onRemove?: (id: string) => void;
};

export const ScannedProductsTable: React.FC<ScannedProductsTableProps> = ({ items, onIncrease, onDecrease, onRemove }) => {
    const toNumber = (value: string | number): number => {
        if (typeof value === "number") return value;
        const cleaned = value.replace(/[^0-9.]/g, "");
        const num = parseFloat(cleaned);
        return Number.isFinite(num) ? num : 0;
    };

    const getLineTotal = (price: string | number, qty: number) => {
        const unit = toNumber(price);
        return unit * qty;
    };

    if (!items?.length) {
        return (
            <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-500 dark:text-gray-400">
                Start scanning products to see them here.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.barcode}</td>
                            <td className="px-4 py-3 text-sm text-right">
                                {typeof item.price === "string" ? item.price : formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onDecrease?.(item.id)}
                                        className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        -
                                    </button>
                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => onIncrease?.(item.id)}
                                        className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        +
                                    </button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">{formatCurrency(getLineTotal(item.price, item.quantity))}</td>
                            <td className="px-4 py-3 text-center">
                                {item.status ? <StatusChip status={item.status} /> : null}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    type="button"
                                    onClick={() => onRemove?.(item.id)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


