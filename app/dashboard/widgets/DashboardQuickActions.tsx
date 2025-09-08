"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { QuickActionItem } from "@/types";
import Link from "next/link";

interface DashboardQuickActionsProps {
  actions: QuickActionItem[];
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ actions }) => {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-0">
          {actions.map((action, index) => {
            const Icon = action.icon;

            const buttonContent = (
              <div key={action.id} className={`${index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
                <Button
                  variant="flat"
                  color="default"
                  className="w-full justify-start h-12 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-0 rounded-none first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                  startContent={<Icon className="h-5 w-5" />}
                >
                  <span className="font-medium">{action.label}</span>
                </Button>
              </div>
            );

            return action.href ? (
              <Link key={action.id} href={action.href}>
                {buttonContent}
              </Link>
            ) : (
              buttonContent
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default DashboardQuickActions;
