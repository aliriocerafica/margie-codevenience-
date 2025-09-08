"use client";

import React from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  variant?: "card" | "inline" | "fullscreen";
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = "Something went wrong. Please try again.", 
  onRetry,
  variant = "inline",
  className = ""
}) => {
  const errorElement = (
    <div className={`flex flex-col items-center justify-center gap-4 text-center ${className}`}>
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Error</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">{message}</p>
      {onRetry && (
        <Button
          color="primary"
          variant="flat"
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={onRetry}
          size="sm"
        >
          Try Again
        </Button>
      )}
    </div>
  );

  switch (variant) {
    case "card":
      return (
        <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardBody className="py-8">
            {errorElement}
          </CardBody>
        </Card>
      );
    
    case "fullscreen":
      return (
        <div className="min-h-screen flex items-center justify-center">
          {errorElement}
        </div>
      );
    
    case "inline":
    default:
      return (
        <div className="py-8">
          {errorElement}
        </div>
      );
  }
};

export default ErrorMessage;
