"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange" | "gray";
  className?: string;
}

const colorClasses = {
  blue: {
    background: "bg-blue-100 dark:bg-blue-900",
    icon: "text-blue-600 dark:text-blue-400"
  },
  green: {
    background: "bg-green-100 dark:bg-green-900",
    icon: "text-green-600 dark:text-green-400"
  },
  yellow: {
    background: "bg-yellow-100 dark:bg-yellow-900",
    icon: "text-yellow-600 dark:text-yellow-400"
  },
  red: {
    background: "bg-red-100 dark:bg-red-900",
    icon: "text-red-600 dark:text-red-400"
  },
  purple: {
    background: "bg-purple-100 dark:bg-purple-900",
    icon: "text-purple-600 dark:text-purple-400"
  },
  orange: {
    background: "bg-orange-100 dark:bg-orange-900",
    icon: "text-orange-600 dark:text-orange-400"
  },
  gray: {
    background: "bg-gray-100 dark:bg-gray-800",
    icon: "text-gray-600 dark:text-gray-400"
  }
};

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue",
  className = ""
}) => {
  const colors = colorClasses[color];

  return (
    <Card className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.background}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default StatCard;
