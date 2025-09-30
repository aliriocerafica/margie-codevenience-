"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { BarChart3, TrendingUp, DollarSign, Users } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics" 
        description="Comprehensive insights and performance metrics for your business." 
      />
      
      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Revenue Growth" value="+15.2%" icon={TrendingUp} color="green" />
        <StatCard title="Customer Acquisition" value="1,234" icon={Users} color="blue" />
        <StatCard title="Average Order Value" value="₱2,450" icon={DollarSign} color="purple" />
        <StatCard title="Conversion Rate" value="3.8%" icon={BarChart3} color="orange" />
      </div>

      {/* Analytics Content Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sales trend chart will be displayed here</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Top products chart will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
