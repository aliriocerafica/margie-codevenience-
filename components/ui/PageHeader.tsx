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
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 ${className}`}>
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">{description}</p>
        )}
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          <Button
            color={action.color || "primary"}
            variant={action.variant || "solid"}
            startContent={action.icon && <action.icon className="h-4 w-4" />}
            onPress={action.onClick}
            className="w-full sm:w-auto"
            size="md"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
