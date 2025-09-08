"use client";

import React from 'react';
import { Button } from '@heroui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color?: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
    variant?: "solid" | "flat" | "bordered" | "light" | "ghost" | "faded";
  };
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  action,
  className = ""
}) => {
  return (
    <div className={`flex justify-between items-start mb-6 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      
      {action && (
        <Button
          color={action.color || "primary"}
          variant={action.variant || "solid"}
          startContent={action.icon && <action.icon className="h-4 w-4" />}
          onPress={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
