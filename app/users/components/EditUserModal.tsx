"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { Mail, Eye, EyeOff, Lock, PencilLine } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  user?: User | null;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, user, onClose, onUserUpdated }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.isActive ?? true);
      setPassword("");
      setEmailError("");
      setPasswordError("");
      setMessage("");
      setShowPassword(false);
    }
  }, [user, isOpen]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return "Email is required";
    if (!emailRegex.test(value)) return "Please include an '@' in the email address.";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return ""; // optional when editing
    if (value.length < 6) return "Password must be at least 6 characters long";
    return "";
  };

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      email !== user.email ||
      role !== user.role ||
      isActive !== (user.isActive ?? true) ||
      (password && password.length > 0)
    );
  }, [email, role, password, isActive, user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    if (!hasChanges) {
      setMessage("No changes to save");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, email, role, password: password || undefined, isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to update user");
      } else {
        onUserUpdated(data.user);
        setMessage("User updated successfully ✔");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      setMessage("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border-none",
        header: "border-b border-gray-200 dark:border-gray-700",
        footer: "border-t border-gray-200 dark:border-gray-700",
        closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <PencilLine className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
            <span className="text-lg font-semibold">Edit User</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
            Update the user's email, role, or password
          </p>
        </ModalHeader>

        <ModalBody className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="user@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(validateEmail(e.target.value));
                  if (message) setMessage("");
                }}
                isRequired
                fullWidth
                size="lg"
                isInvalid={!!emailError}
                errorMessage={emailError}
                startContent={<Mail className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />}
                classNames={{
                  input: "text-sm py-3 px-3",
                  inputWrapper:
                    "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                New Password (optional)
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                  if (message) setMessage("");
                }}
                fullWidth
                size="lg"
                isInvalid={!!passwordError}
                errorMessage={passwordError}
                startContent={<Lock className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />}
                endContent={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                    )}
                  </button>
                }
                classNames={{
                  input: "text-sm py-3 px-3",
                  inputWrapper:
                    "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <Select
                placeholder="Select user role"
                selectedKeys={[role]}
                onSelectionChange={(keys) => setRole(Array.from(keys)[0] as string)}
                size="lg"
                classNames={{
                  trigger:
                    "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                  value: "text-sm px-3",
                }}
              >
                <SelectItem key="Admin">Admin</SelectItem>
                <SelectItem key="Staff">Staff</SelectItem>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Account Status
              </label>
              <Switch
                isSelected={isActive}
                onValueChange={setIsActive}
                size="lg"
                classNames={{
                  wrapper: "p-0 h-7 overflow-visible",
                  thumb: "w-6 h-6 border-2 shadow-lg",
                }}
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </Switch>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isActive 
                  ? "User can log in and access the system" 
                  : "User cannot log in. Please contact store owner."}
              </p>
            </div>

            {message && (
              <div
                className={`text-center text-sm p-3 rounded-xl shadow-sm ${
                  message.includes("success") || message.includes("✔")
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                    : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </ModalBody>

        <ModalFooter className="justify-end gap-2">
          <Button variant="light" onPress={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={() => handleSubmit()}
            isLoading={loading}
            startContent={!loading ? <PencilLine className="w-4 h-4" /> : null}
            className="bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] text-white"
            disabled={loading || !!emailError || !!passwordError || !hasChanges}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;


