"use client";

import React from 'react';
import { Chip } from '@heroui/chip';

interface StatusChipProps {
  status: string;
  colorMap?: Record<string, "success" | "danger" | "warning" | "default" | "primary" | "secondary">;
  variant?: "solid" | "flat" | "bordered" | "light" | "dot" | "shadow" | "faded";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  colorMap = {
    active: "success",
    available: "success",
    inactive: "danger",
    out_of_stock: "danger",
    low_stock: "warning",
    pending: "warning",
    completed: "success",
    cancelled: "danger",
  },
  variant = "flat",
  size = "sm",
  className = ""
}) => {
  const color = colorMap[status] || "default";
  
  // Format status text for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Chip 
      color={color} 
      variant={variant}
      size={size}
      className={className}
    >
      {formatStatus(status)}
    </Chip>
  );
};

export default StatusChip;
