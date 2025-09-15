"use client";

import React from "react";
import { Chip } from "@heroui/react";

import DataTable from "@/components/DataTable";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  data: User[] | undefined;
  isLoading?: boolean;
  error?: any;
}

const USER_ROLE_COLORS = {
  Admin: "warning",
  Staff: "primary",
} as const;

const USER_STATUS_OPTIONS = [
  { key: "all", label: "All Roles" },
  { key: "Admin", label: "Admin" },
  { key: "Staff", label: "Staff" },
];

export const UserTable: React.FC<UserTableProps> = ({
  data,
  isLoading,
  error,
}) => {
  // Transform data to include status field that matches role for filtering
  const transformedData = data?.map((user) => ({
    ...user,
    status: user.role, // Add status field that matches role for DataTable filtering
  }));

  const columns = [
    {
      key: "email",
      header: "Email",
      renderCell: (row: User) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {row.email}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID: {row.id.slice(0, 8)}...
          </p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      renderCell: (row: User) => (
        <Chip
          className={`${
            row.role === "Admin"
              ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
              : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
          }`}
          color={
            USER_ROLE_COLORS[row.role as keyof typeof USER_ROLE_COLORS] ||
            "default"
          }
          size="sm"
          variant="flat"
        >
          {row.role}
        </Chip>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      renderCell: (row: User) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-white">
            {new Date(row.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(row.createdAt).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      renderCell: (row: User) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-white">
            {new Date(row.updatedAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(row.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <DataTable
          columns={columns}
          data={[]}
          description="Loading users..."
          filter={true}
          isLoading={true}
          label="User List"
          statusOptions={USER_STATUS_OPTIONS}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <DataTable
          columns={columns}
          data={[]}
          description="Failed to load users."
          error={error}
          filter={true}
          label="User List"
          statusOptions={USER_STATUS_OPTIONS}
        />
      </div>
    );
  }

  return (
    <div className="py-6">
      <DataTable
        columns={columns}
        data={transformedData || []}
        description="Manage system users and their access levels."
        filter={true}
        label="User List"
        statusOptions={USER_STATUS_OPTIONS}
      />
    </div>
  );
};

export default UserTable;
