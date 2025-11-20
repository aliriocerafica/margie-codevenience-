"use client";

import React, { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ReceiptSummary } from "../components/ReceiptSummary";
import { ScannedProduct } from "../components/ScannedProductsTable";
import { ReceiptModal } from "../components/ReceiptModal";
import { AdminAuthModal } from "../components/AdminAuthModal";
import { VoidRequestModal } from "../components/VoidRequestModal";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { useNotifications } from "@/contexts/NotificationContext";

export type ReceiptPanelProps = {
    items: ScannedProduct[];
    onClearItems: () => void;
    onClearItemsSilent: () => void;
};

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({ items, onClearItems, onClearItemsSilent }) => {
    const { data: session } = useSession();
    const [amountReceived, setAmountReceived] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [pendingSummary, setPendingSummary] = useState<{ low: number; out: number } | null>(null);
    const [pendingItems, setPendingItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [originalTransactionNo, setOriginalTransactionNo] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingAction, setProcessingAction] = useState<"complete" | "void" | null>(null);
    const { refreshNotifications } = useNotifications();
    
    // Void approval modals
    const [isVoidRequestModalOpen, setIsVoidRequestModalOpen] = useState(false);
    const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Fetch user role
    React.useEffect(() => {
        const fetchUserRole = async () => {
            if (session?.user?.email) {
                try {
                    const response = await fetch(`/api/users?email=${session.user.email}`);
                    if (response.ok) {
                        const users = await response.json();
                        const currentUser = users.find((u: any) => u.email === session.user.email);
                        if (currentUser) {
                            setUserRole(currentUser.role);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            }
        };
        fetchUserRole();
    }, [session]);

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const unit = typeof item.price === "string" ? parseFloat(item.price) : item.price;
            return sum + unit * item.quantity;
        }, 0);
    }, [items]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - discount);
    }, [subtotal, discount]);

    const handleCheckout = async () => {
        if (!items || items.length === 0) {
            showNotification({
                title: 'No items to checkout',
                description: 'Please scan or add at least one item before checking out.',
                type: 'error'
            });
            return;
        }
        
        // Validate amount received
        if (amountReceived <= 0) {
            showNotification({
                title: 'Amount Received Required',
                description: 'Please enter the amount received before proceeding with checkout.',
                type: 'error'
            });
            return;
        }

        // Validate that amount received is sufficient
        if (amountReceived < total) {
            showNotification({
                title: 'Insufficient Amount',
                description: `Amount received (₱${amountReceived.toFixed(2)}) is less than total (₱${total.toFixed(2)}). Please enter a sufficient amount.`,
                type: 'error'
            });
            return;
        }

        const change = Math.max(0, amountReceived - total);

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
                    
                    // Handle insufficient stock error specifically
                    if (err.error === "Insufficient stock" && err.details) {
                        showNotification({
                            title: 'Insufficient Stock',
                            description: err.details.join(', '),
                            type: 'error'
                        });
                    } else {
                        showNotification({
                            title: 'Checkout Failed',
                            description: err.message || err.error || 'Unable to update stock. Please try again.',
                            type: 'error'
                        });
                    }
                } catch (parseError) {
                    showNotification({
                        title: 'Checkout Failed',
                        description: 'Unable to update stock. Please try again.',
                        type: 'error'
                    });
                }
                return;
            }
            const data = await response.json();

            // Immediately refresh notifications to show new stock alerts
            try { await refreshNotifications(); } catch {}

            // Set receipt data (but don't open modal yet - wait for "Checkout Done")
            setReceiptData({
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
                total,
                amountReceived,
                change,
                timestamp: new Date(),
                transactionNo: data.transactionNo,
            });

            const lowCount = (data?.summary?.lowNow ?? []).length;
            const outCount = (data?.summary?.outNow ?? []).length;
            setPendingSummary({ low: lowCount, out: outCount });
            setPendingItems(items.map(i => ({ productId: i.id, quantity: i.quantity })));
            setOriginalTransactionNo(data.transactionNo); // Store for potential void
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
            setOriginalTransactionNo(null); // Clear original transaction number
            setAmountReceived(0);
            setDiscount(0);
            onClearItemsSilent(); // Clear without confirmation after checkout done
            // Open receipt modal after checkout is confirmed complete
            setIsReceiptOpen(true);
        } finally {
            setIsProcessing(false);
            setProcessingAction(null);
        }
    };

    const handleVoidClick = () => {
        // Check user role
        if (userRole === "Staff") {
            // Staff needs admin approval
            setIsConfirmOpen(false);
            setIsVoidRequestModalOpen(true);
        } else {
            // Admin can void directly (with confirmation)
            handleVoidDirect();
        }
    };

    const handleVoidDirect = async (approvedBy?: string) => {
        try {
            setProcessingAction('void');
            setIsProcessing(true);
            await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: pendingItems, 
                    action: 'void',
                    originalTransactionNo: originalTransactionNo,
                    approvedBy: approvedBy // Log who approved (for on-site admin auth)
                })
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
            setOriginalTransactionNo(null);
            setReceiptData(null);
            setAmountReceived(0);
            setDiscount(0);
            onClearItemsSilent(); // Clear without confirmation after void
            setIsProcessing(false);
            setProcessingAction(null);
        }
    };

    const handleOnSiteApproval = () => {
        setIsVoidRequestModalOpen(false);
        setIsAdminAuthModalOpen(true);
    };

    const handleVoidRequestModalClose = () => {
        // Just close the void request modal and return to confirmation modal
        // Don't void the transaction - let user decide what to do
        setIsVoidRequestModalOpen(false);
        setIsConfirmOpen(true); // Return to confirmation modal
    };

    const handleRemoteApproval = async (reason: string) => {
        try {
            const response = await fetch('/api/void-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionNo: originalTransactionNo,
                    reason,
                    transactionData: {
                        items: pendingItems,
                        totalAmount: total,
                        receiptData,
                    },
                }),
            });

            if (response.ok) {
                showNotification({
                    title: 'Void Request Sent',
                    description: 'Your void request has been sent to admin for approval.',
                    type: 'success'
                });
                
                // Trigger custom event to notify sidebar to refresh void request count
                window.dispatchEvent(new CustomEvent('voidRequestCreated'));
                
                // Close modals and clear state
                setIsVoidRequestModalOpen(false);
                setIsConfirmOpen(false);
                setPendingSummary(null);
                setPendingItems([]);
                setOriginalTransactionNo(null);
                setReceiptData(null);
                setAmountReceived(0);
                setDiscount(0);
                onClearItemsSilent(); // Clear without confirmation after sending void request
            } else {
                showNotification({
                    title: 'Request Failed',
                    description: 'Failed to send void request. Please try again.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error sending void request:', error);
            showNotification({
                title: 'Request Failed',
                description: 'Failed to send void request. Please try again.',
                type: 'error'
            });
        }
    };

    const handleAdminAuthModalClose = () => {
        // Just close the admin auth modal and return to confirmation modal
        // Don't void the transaction - let user decide what to do
        setIsAdminAuthModalOpen(false);
        setIsConfirmOpen(true); // Return to confirmation modal
    };

    const handleAdminVerified = (adminId: string, adminEmail: string) => {
        setIsAdminAuthModalOpen(false);
        handleVoidDirect(adminId);
    };

    const handleClear = () => {
        onClearItems();
        setAmountReceived(0);
        setDiscount(0);
    };

    const change = Math.max(0, amountReceived - total);

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
                    <label className="text-sm text-gray-600 dark:text-gray-400">Amount Received (₱)</label>
                    <input 
                        type="number" 
                        className="w-32 h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-3"
                        value={amountReceived}
                        onChange={e => setAmountReceived(Math.max(0, Number(e.target.value || 0)))}
                        min={0}
                    />
                </div>
            </div>

            <ReceiptSummary 
                subtotal={subtotal}
                discount={discount}
                amountReceived={amountReceived}
                change={change}
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
                            onPress={handleVoidClick}
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

            {/* Receipt Modal */}
            {receiptData && (
                <ReceiptModal
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    receiptData={receiptData}
                />
            )}

            {/* Void Request Modal (On-Site or Remote) */}
            <VoidRequestModal
                isOpen={isVoidRequestModalOpen}
                onClose={handleVoidRequestModalClose}
                onSelectOnSite={handleOnSiteApproval}
                onSelectRemote={handleRemoteApproval}
                transactionData={{
                    transactionNo: originalTransactionNo,
                    totalAmount: total,
                }}
            />

            {/* Admin Auth Modal (On-Site Approval) */}
            <AdminAuthModal
                isOpen={isAdminAuthModalOpen}
                onClose={handleAdminAuthModalClose}
                onVerified={handleAdminVerified}
                title="Admin Authorization for Void"
                description="Enter admin credentials to authorize voiding this transaction."
            />
        </div>
    );
};


