"use client";

import React, { useState, useEffect } from "react";
import { UserTable } from "./components/UserTable";
import { AddUserModal } from "./components/AddUserModal";
import { EditUserModal } from "./components/EditUserModal";
import { DeleteUserModal } from "./components/DeleteUserModal";
import { Button } from "@heroui/button";
import { UserPlus } from "lucide-react";
import { usePageHighlight } from "@/hooks/usePageHighlight";

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Enable page highlighting for search results
  usePageHighlight();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching users from /api/users...");
      const response = await fetch("/api/users");
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      console.log("Users data received:", data);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleRequestDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUserUpdated = (updated: User) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserDeleted = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Manage system users and their roles</p>
        </div>

        <div className="flex-shrink-0">
          <Button
            color="primary"
            startContent={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] w-full sm:w-auto"
            size="md"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        data={users}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleRequestDelete}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        user={selectedUser ? { id: selectedUser.id, email: selectedUser.email } : null}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedUser(null); }}
        onDeleted={handleUserDeleted}
      />
    </div>
  );
}
