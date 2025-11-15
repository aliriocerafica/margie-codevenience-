"use client";

import React from "react";
import { formatCurrency } from "@/lib/constants";

export type ReceiptLine = {
    label: string;
    value: number;
    emphasize?: boolean;
};

export type ReceiptSummaryProps = {
    subtotal: number;
    amountReceived?: number;
    change?: number;
    additionalFees?: ReceiptLine[];
    onCheckout?: () => void;
    onClear?: () => void;
};

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({ subtotal, amountReceived = 0, change = 0, additionalFees = [], onCheckout, onClear }) => {
    const formatCurrency2dp = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };
    const feesTotal = additionalFees.reduce((sum, f) => sum + f.value, 0);
    const grandTotal = Math.max(0, subtotal + feesTotal);

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900 space-y-4">
            <h3 className="text-base font-semibold">Receipt Summary</h3>

            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">{formatCurrency2dp(subtotal)}</span>
                </div>
                {additionalFees.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{f.label}</span>
                        <span className={f.emphasize ? "font-semibold" : "font-medium"}>{formatCurrency2dp(f.value)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                <div className="flex items-center justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{formatCurrency2dp(grandTotal)}</span>
                </div>
            </div>

            {amountReceived > 0 && (
                <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-800 pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount Received</span>
                        <span className="font-medium">{formatCurrency2dp(amountReceived)}</span>
                    </div>
                    {change >= 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Change</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency2dp(change)}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClear}
                    className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={onCheckout}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#003366] to-[#004488] text-white hover:from-[#002244] hover:to-[#003366]"
                >
                    Checkout
                </button>
            </div>
        </div>
    );
};


