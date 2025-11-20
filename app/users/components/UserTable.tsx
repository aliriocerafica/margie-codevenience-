"use client";

import React from "react";
import { Chip, Button, Tooltip } from "@heroui/react";
import { Edit } from "lucide-react";

import DataTable from "@/components/DataTable";

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  data: User[] | undefined;
  isLoading?: boolean;
  error?: any;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  data,
  isLoading,
  error,
  onEdit,
  onDelete,
}) => {
  // Transform data to include status field for filtering
  const transformedData = data?.map((user) => ({
    ...user,
    status: user.isActive ? "active" : "inactive", // Add status field for DataTable filtering
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
      key: "isActive",
      header: "Status",
      renderCell: (row: User) => (
        <Chip
          className={`${
            row.isActive
              ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
          }`}
          color={row.isActive ? "success" : "danger"}
          size="sm"
          variant="flat"
        >
          {row.isActive ? "Active" : "Inactive"}
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
    {
      key: "actions",
      header: "Actions",
      renderCell: (row: User) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip content="Edit" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => onEdit?.(row)}
            >
              <Edit size={16} />
            </Button>
          </Tooltip>
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
          description="Loading staff users..."
          filter={true}
          isLoading={true}
          label="Staff List"
          showColumnFilter={false}
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
          description="Failed to load staff users."
          error={error}
          filter={true}
          label="Staff List"
          showColumnFilter={false}
        />
      </div>
    );
  }

  return (
    <div className="py-6">
      <DataTable
        columns={columns}
        data={transformedData || []}
        description="Manage staff users and their access levels."
        filter={true}
        label="Staff List"
        showColumnFilter={false}
      />
    </div>
  );
};

export default UserTable;
