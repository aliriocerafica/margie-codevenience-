"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { AlertTriangle, UserCheck, Send } from "lucide-react";

export type VoidRequestModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelectOnSite: () => void;
    onSelectRemote: (reason: string) => void;
    transactionData: any;
};

export const VoidRequestModal: React.FC<VoidRequestModalProps> = ({
    isOpen,
    onClose,
    onSelectOnSite,
    onSelectRemote,
    transactionData,
}) => {
    const [reason, setReason] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");

    const handleOnSiteClick = () => {
        setReason("");
        setError("");
        onSelectOnSite();
    };

    const handleRemoteClick = async () => {
        if (!reason.trim()) {
            setError("Please provide a reason for the void request");
            return;
        }

        setIsSending(true);
        setError("");

        try {
            onSelectRemote(reason);
            setReason("");
        } catch (err) {
            setError("Failed to send request");
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setReason("");
        setError("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h3 className="text-lg font-semibold">Void Transaction - Admin Approval Required</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                        This transaction requires admin authorization to void. Choose your approval method:
                    </p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        {/* Transaction Info */}
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction</div>
                            <div className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                                {transactionData?.transactionNo || "N/A"}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Total: ₱{transactionData?.totalAmount?.toFixed(2) || "0.00"}
                            </div>
                        </div>

                        {/* Option 1: On-Site */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 mt-1">
                                    <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        On-Site Authorization
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        Admin enters credentials now for immediate approval
                                    </p>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="flat"
                                        onPress={handleOnSiteClick}
                                        className="w-full"
                                    >
                                        Request Admin Now
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Option 2: Remote */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 mt-1">
                                    <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        Send Remote Request
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        Admin can approve later from anywhere
                                    </p>
                                    <Textarea
                                        label="Reason for Void"
                                        placeholder="Explain why this transaction needs to be voided..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        minRows={3}
                                        maxRows={5}
                                        variant="bordered"
                                        className="mb-2"
                                        isDisabled={isSending}
                                    />
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        variant="flat"
                                        onPress={handleRemoteClick}
                                        isLoading={isSending}
                                        className="w-full"
                                    >
                                        {isSending ? "Sending..." : "Send Request"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={handleClose} isDisabled={isSending}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

