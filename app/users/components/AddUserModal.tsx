"use client";

import React, { useState } from "react";
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
import { Mail, Eye, EyeOff, Lock, UserPlus } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: User) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please include an '@' in the email address. '" + email + "' is missing an '@'.";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
    if (message) setMessage("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (message) setMessage("");
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRole("Admin");
    setIsActive(true);
    setEmailError("");
    setPasswordError("");
    setMessage("");
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) {
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, isActive }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage(data.error || "Something went wrong");
      } else {
        setMessage("User created successfully! 🎉");
        // Call the parent callback with the new user
        onUserAdded(data.user);
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setMessage("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonPress = () => {
    handleSubmit();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
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
            <UserPlus className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
            <span className="text-lg font-semibold">Add New User</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
            Create a new user account with Admin or Staff role
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
                onChange={handleEmailChange}
                isRequired
                fullWidth
                size="lg"
                isInvalid={!!emailError}
                errorMessage={emailError}
                startContent={
                  <Mail className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                }
                classNames={{
                  input: "text-sm py-3 px-3",
                  inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
                isRequired
                fullWidth
                size="lg"
                isInvalid={!!passwordError}
                errorMessage={passwordError}
                startContent={
                  <Lock className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-[#003366] dark:text-[#4A90E2] hover:text-[#004488] dark:hover:text-[#6BA3F0] transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#003366] dark:text-[#4A90E2] hover:text-[#004488] dark:hover:text-[#6BA3F0] transition-colors" />
                    )}
                  </button>
                }
                classNames={{
                  input: "text-sm py-3 px-3",
                  inputWrapper: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700"
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
                  trigger: "h-12 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700",
                  value: "text-sm px-3"
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
              <div className={`text-center text-sm p-3 rounded-xl shadow-sm ${message.includes("successful")
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200"
                }`}>
                {message}
              </div>
            )}
          </form>
        </ModalBody>
        
        <ModalFooter className="justify-end gap-2">
          <Button 
            variant="light" 
            onPress={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleButtonPress}
            isLoading={loading}
            startContent={!loading ? <UserPlus className="w-4 h-4" /> : null}
            className="bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] text-white"
            disabled={loading || !!emailError || !!passwordError}
          >
            {loading ? "Creating User..." : "Add User"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
