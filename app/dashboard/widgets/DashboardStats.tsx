"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { DashboardStat } from "@/types";

interface DashboardStatsProps {
  stats: DashboardStat[];
}

export const DashboardStatsCard: React.FC<{ stat: DashboardStat }> = ({ stat }) => {
  const Icon = stat.icon;

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:shadow-lg transition-shadow duration-200">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stat.value}
            </p>
            {stat.change && (
              <p
                className={`text-sm mt-1 font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600 dark:text-green-400"
                    : stat.changeType === "negative"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {stat.change}
              </p>
            )}
          </div>
          <div className="p-3 bg-gradient-to-r from-[#003366]/10 to-[#004488]/10 dark:from-[#003366]/20 dark:to-[#004488]/20 rounded-xl">
            <Icon className="h-6 w-6 text-[#003366] dark:text-[#4488cc]" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <DashboardStatsCard key={index} stat={stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
