"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Trash2 } from "lucide-react";

interface UserRef {
  id: string;
  email: string;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  user?: UserRef | null;
  onClose: () => void;
  onDeleted: (userId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, user, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDelete = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setMessage("");
      const res = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Failed to delete user");
        return;
      }
      onDeleted(user.id);
      setMessage("User deleted ✔");
      setTimeout(() => onClose(), 600);
    } catch (err) {
      setMessage("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" backdrop="blur" classNames={{
      backdrop: "bg-black/50 backdrop-blur-sm",
      base: "border-none",
      header: "border-b border-gray-200 dark:border-gray-700",
      footer: "border-t border-gray-200 dark:border-gray-700",
      closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
    }}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <span className="text-lg font-semibold">Delete User</span>
        </ModalHeader>
        <ModalBody className="py-5">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete
            {" "}
            <span className="font-semibold">{user?.email}</span>? This action cannot be undone.
          </p>
          {message && (
            <div className={`text-center text-sm p-2 rounded-lg ${message.includes("✔") ? "bg-red-50 text-red-700 border border-red-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
              {message}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-end gap-2">
          <Button variant="light" onPress={onClose} disabled={loading}>Cancel</Button>
          <Button color="danger" onPress={handleDelete} isLoading={loading} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteUserModal;


