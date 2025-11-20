"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { ShieldCheck, Lock, Mail } from "lucide-react";

export type AdminAuthModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onVerified: (adminId: string, adminEmail: string) => void;
    title?: string;
    description?: string;
};

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
    isOpen,
    onClose,
    onVerified,
    title = "Admin Authorization Required",
    description = "Please enter admin credentials to authorize this action.",
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }

        setIsVerifying(true);
        setError("");

        try {
            const response = await fetch("/api/auth/verify-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Verification failed");
                return;
            }

            // Success - call onVerified callback
            onVerified(data.admin.id, data.admin.email);
            
            // Reset form
            setEmail("");
            setPassword("");
            setError("");
            onClose();
        } catch (err) {
            setError("Failed to verify credentials");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setPassword("");
        setError("");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleVerify();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                        {description}
                    </p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <Input
                            label="Admin Email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            startContent={<Mail className="h-4 w-4 text-gray-400" />}
                            type="email"
                            variant="bordered"
                            isDisabled={isVerifying}
                            autoFocus
                        />
                        <Input
                            label="Admin Password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            startContent={<Lock className="h-4 w-4 text-gray-400" />}
                            type="password"
                            variant="bordered"
                            isDisabled={isVerifying}
                        />
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={handleClose} isDisabled={isVerifying}>
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleVerify} 
                        isLoading={isVerifying}
                        className="bg-gradient-to-r from-blue-600 to-blue-700"
                    >
                        {isVerifying ? "Verifying..." : "Verify & Authorize"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

