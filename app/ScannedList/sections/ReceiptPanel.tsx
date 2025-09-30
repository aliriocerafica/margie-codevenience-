"use client";

import React, { useMemo, useState } from "react";
import { ReceiptSummary } from "../components/ReceiptSummary";
import { ScannedProduct } from "../components/ScannedProductsTable";
import { printReceipt } from "../utils/printReceipt";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { useNotifications } from "@/contexts/NotificationContext";

export type ReceiptPanelProps = {
    items: ScannedProduct[];
    onClearItems: () => void;
};

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({ items, onClearItems }) => {
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(12);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingSummary, setPendingSummary] = useState<{ low: number; out: number } | null>(null);
    const [pendingItems, setPendingItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingAction, setProcessingAction] = useState<"complete" | "void" | null>(null);
    const { refreshNotifications } = useNotifications();

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const unit = typeof item.price === "string" ? parseFloat(item.price) : item.price;
            return sum + unit * item.quantity;
        }, 0);
    }, [items]);

    const handleCheckout = async () => {
        if (!items || items.length === 0) {
            showNotification({
                title: 'No items to checkout',
                description: 'Please scan or add at least one item before checking out.',
                type: 'error'
            });
            return;
        }
        const taxAmount = (Math.max(0, subtotal - discount) * taxRate) / 100;
        const total = Math.max(0, subtotal - discount) + taxAmount;

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
                    action: "sale",
                }),
            });
            if (!response.ok) {
                try {
                    const err = await response.json();
                    console.error("Checkout failed:", err);
                } catch {}
                showNotification({
                    title: 'Checkout Failed',
                    description: 'Unable to update stock. Please try again.',
                    type: 'error'
                });
                return;
            }
            const data = await response.json();

            // Immediately refresh notifications to show new stock alerts
            try { await refreshNotifications(); } catch {}

            await printReceipt({
                storeName: "Margie CodeVenience",
                storePhone: "",
                storeAddressLines: [],
                logoPath: "/Logo.png",
                items: items.map((i) => ({
                    name: i.name,
                    barcode: i.barcode,
                    price: typeof i.price === "string" ? parseFloat(i.price) : i.price,
                    quantity: i.quantity,
                })),
                subtotal,
                discount,
                taxAmount,
                total,
                timestamp: new Date(),
            });

            const lowCount = (data?.summary?.lowNow ?? []).length;
            const outCount = (data?.summary?.outNow ?? []).length;
            setPendingSummary({ low: lowCount, out: outCount });
            setPendingItems(items.map(i => ({ productId: i.id, quantity: i.quantity })));
            setIsConfirmOpen(true);
        } catch (e) {
            console.error(e);
            showNotification({
                title: 'Checkout Error',
                description: 'Unexpected error during checkout. Please try again.',
                type: 'error'
            });
        }
    };

    const showNotification = ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' }) => {
        if (typeof window === 'undefined') return;
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg w-[360px] max-w-[90vw] ${
          type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`;
        notification.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <div class="font-semibold">${title}</div>
              <div class="text-sm opacity-90">${description}</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => { if (notification.parentElement) notification.remove(); }, 5000);
    };

    const handleConfirmComplete = async () => {
        setProcessingAction('complete');
        setIsProcessing(true);
        try {
            if (pendingSummary) {
                showNotification({
                    title: 'Checkout Completed',
                    description: `${pendingSummary.low} low, ${pendingSummary.out} out of stock updated.`,
                    type: 'success'
                });
            }
            // Show spinner briefly to match edit/delete UX timing (~300ms)
            await new Promise(resolve => setTimeout(resolve, 300));
            // Now close and clean up
            setIsConfirmOpen(false);
            setPendingSummary(null);
            setPendingItems([]);
            onClearItems();
        } finally {
            setIsProcessing(false);
            setProcessingAction(null);
        }
    };

    const handleVoid = async () => {
        try {
            setProcessingAction('void');
            setIsProcessing(true);
            await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: pendingItems, action: 'void' })
            });
            showNotification({
                title: 'Checkout Voided',
                description: 'Transaction was voided and stock restored.',
                type: 'error'
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsConfirmOpen(false);
            setPendingSummary(null);
            setPendingItems([]);
            onClearItems();
            setIsProcessing(false);
            setProcessingAction(null);
        }
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

            {/* Confirmation Modal */}
            <Modal 
                isOpen={isConfirmOpen} 
                onClose={() => { if (!isProcessing) setIsConfirmOpen(false); }} 
                isDismissable={false} 
                hideCloseButton 
                size="md"
                backdrop="blur"
                classNames={{
                    backdrop: "bg-black/50 backdrop-blur-sm",
                    base: "border-none",
                    header: "border-b border-gray-200 dark:border-gray-700",
                    footer: "border-t border-gray-200 dark:border-gray-700",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">Confirm Checkout</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                            Finalize this transaction or void it to restore stock levels.
                        </p>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        {pendingSummary && (
                            <div className="space-y-2 text-sm">
                                <div className="text-gray-700 dark:text-gray-300">
                                    Expected stock changes: <strong>{pendingSummary.low}</strong> low, <strong>{pendingSummary.out}</strong> out of stock.
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">
                                    Choose “Checkout Done” to keep these changes, or “Void” to cancel and restore stock.
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter className="justify-end gap-2">
                        <Button 
                            variant="light" 
                            color="danger" 
                            onPress={handleVoid}
                            isDisabled={isProcessing}
                            isLoading={isProcessing && processingAction === 'void'}
                        >
                            Void
                        </Button>
                        <Button 
                            color="primary" 
                            onPress={handleConfirmComplete}
                            isDisabled={isProcessing}
                            isLoading={isProcessing && processingAction === 'complete'}
                        >
                            Checkout Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};


