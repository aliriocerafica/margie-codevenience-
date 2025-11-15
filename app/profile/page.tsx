"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Edit, Lock, Shield, User, Users } from "lucide-react";
import { useSession } from "next-auth/react";

import { usePageHighlight } from "@/hooks/usePageHighlight";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  usePageHighlight();

  useEffect(() => {
    if (session?.user) {
      const userProfile: UserProfile = {
        id: session.user.id as string,
        name: session.user.name || session.user.email?.split("@")[0] || "User",
        email: session.user.email as string,
        role: session.user.role as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setProfile(userProfile);
      setFormData((prev) => ({
        ...prev,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
      }));
    }
  }, [session]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) return "Email is required";

    if (!emailRegex.test(email)) return "Please enter a valid email address";

    return "";
  };

  const validatePassword = (password: string) => {
    if (password && password.length < 6)
      return "Password must be at least 6 characters long";

    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (message) setMessage("");
  };

  const validateName = (name: string) => {
    if (!name.trim()) return "Name is required";

    return "";
  };

  const validateRole = (role: string) => {
    if (!role.trim()) return "Role is required";

    return "";
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "owner":
        return <Shield className="w-4 h-4" />;
      case "staff":
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "owner":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "staff":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const handleSave = async () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      role: validateRole(formData.role),
      currentPassword: "",
      newPassword: validatePassword(formData.newPassword),
      confirmPassword:
        formData.newPassword &&
        formData.newPassword !== formData.confirmPassword
          ? "Passwords do not match"
          : "",
    };

    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword =
        "Current password is required to change password";
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Update profile information (if changed)
      const profileUpdates: any = {};
      if (formData.name !== profile?.name) {
        profileUpdates.name = formData.name;
      }
      if (formData.email !== profile?.email) {
        profileUpdates.email = formData.email;
      }
      if (formData.role !== profile?.role) {
        profileUpdates.role = formData.role;
      }

      // Update profile if there are changes
      if (Object.keys(profileUpdates).length > 0 && profile?.id) {
        const profileRes = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: profile.id,
            ...profileUpdates,
          }),
        });

        if (!profileRes.ok) {
          const profileError = await profileRes.json();
          throw new Error(profileError.error || "Failed to update profile");
        }
      }

      // Change password if provided
      if (formData.newPassword && formData.currentPassword) {
        const passwordRes = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        });

        if (!passwordRes.ok) {
          const passwordError = await passwordRes.json();
          throw new Error(passwordError.error || "Failed to change password");
        }
      }

      setMessage("Profile updated successfully!");
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      
      // Refresh the page to update session if needed
      window.location.reload();
    } catch (error) {
      setMessage("Error updating profile: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            color="primary"
            size="sm"
            startContent={<Edit className="w-4 h-4" />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <Card>
          <CardBody className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Side - Avatar and Upload Sections */}
              <div className="space-y-8">
                {/* Profile Avatar */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar
                      className="bg-gradient-to-br from-gray-600 to-gray-800 text-white w-40 h-40 text-4xl shadow-lg"
                      name={profile.name?.charAt(0).toUpperCase() || "U"}
                      size="lg"
                    />
                    <button className="absolute top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* Role Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getRoleColor(profile.role)}`}
                  >
                    {getRoleIcon(profile.role)}
                    <span className="uppercase tracking-wide">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Form Fields */}
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="name"
                  >
                    Name:
                  </label>
                  <Input
                    classNames={{
                      inputWrapper: "border-gray-300 dark:border-gray-600",
                    }}
                    errorMessage={errors.name}
                    id="name"
                    isDisabled={!isEditing}
                    isInvalid={!!errors.name}
                    placeholder="User name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                {/* Email/Username Field */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="email"
                  >
                    Email or Username:
                  </label>
                  <Input
                    classNames={{
                      inputWrapper: "border-gray-300 dark:border-gray-600",
                    }}
                    errorMessage={errors.email}
                    id="email"
                    isDisabled={!isEditing}
                    isInvalid={!!errors.email}
                    placeholder="user@example.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                {/* Role Field */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="role"
                  >
                    Role:
                  </label>
                  <Input
                    classNames={{
                      inputWrapper: "border-gray-300 dark:border-gray-600",
                    }}
                    errorMessage={errors.role}
                    id="role"
                    isDisabled={!isEditing}
                    isInvalid={!!errors.role}
                    placeholder="Admin, Staff, User"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                  />
                </div>

                {/* Change Password Section */}
                {isEditing && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Change Password
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          htmlFor="currentPassword"
                        >
                          Current Password:
                        </label>
                        <Input
                          classNames={{
                            inputWrapper:
                              "border-gray-300 dark:border-gray-600",
                          }}
                          errorMessage={errors.currentPassword}
                          id="currentPassword"
                          isInvalid={!!errors.currentPassword}
                          placeholder="Enter current password"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) =>
                            handleInputChange("currentPassword", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          htmlFor="newPassword"
                        >
                          New Password:
                        </label>
                        <Input
                          classNames={{
                            inputWrapper:
                              "border-gray-300 dark:border-gray-600",
                          }}
                          errorMessage={errors.newPassword}
                          id="newPassword"
                          isInvalid={!!errors.newPassword}
                          placeholder="Enter new password"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) =>
                            handleInputChange("newPassword", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          htmlFor="confirmPassword"
                        >
                          Confirm New Password:
                        </label>
                        <Input
                          classNames={{
                            inputWrapper:
                              "border-gray-300 dark:border-gray-600",
                          }}
                          errorMessage={errors.confirmPassword}
                          id="confirmPassword"
                          isInvalid={!!errors.confirmPassword}
                          placeholder="Confirm new password"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-8">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      isLoading={loading}
                      size="md"
                      onClick={handleSave}
                    >
                      {loading ? "SAVING..." : "SAVE"}
                    </Button>
                    <Button
                      className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      size="md"
                      variant="bordered"
                      onClick={() => setIsEditing(false)}
                    >
                      CANCEL
                    </Button>
                  </div>
                )}

                {/* Status Message */}
                {message && (
                  <div
                    className={`p-4 rounded-lg border mt-6 ${
                      message.includes("successfully")
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {message.includes("successfully") ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              clipRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              fillRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              clipRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              fillRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium">{message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
