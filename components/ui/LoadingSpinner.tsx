"use client";

import React from 'react';
import { Spinner } from '@heroui/spinner';
import { Card, CardBody } from '@heroui/card';

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "inline" | "fullscreen";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  size = "md",
  variant = "inline",
  className = ""
}) => {
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Spinner size={size} color="primary" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );

  switch (variant) {
    case "card":
      return (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <CardBody className="py-8">
            {spinnerElement}
          </CardBody>
        </Card>
      );
    
    case "fullscreen":
      return (
        <div className="min-h-screen flex items-center justify-center">
          {spinnerElement}
        </div>
      );
    
    case "inline":
    default:
      return (
        <div className="py-8">
          {spinnerElement}
        </div>
      );
  }
};

export default LoadingSpinner;
