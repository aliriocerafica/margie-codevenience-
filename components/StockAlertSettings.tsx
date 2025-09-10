"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Switch } from '@heroui/switch';
import { Chip } from '@heroui/chip';
import { 
  Settings, 
  AlertTriangle, 
  Package, 
  Bell,
  Save,
  RotateCcw
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { SAMPLE_PRODUCTS } from '@/lib/constants';

interface StockAlertSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StockAlertSettings({ isOpen, onClose }: StockAlertSettingsProps) {
  const { 
    lowStockThreshold, 
    setLowStockThreshold, 
    notifications, 
    refreshNotifications 
  } = useNotifications();
  
  const [tempThreshold, setTempThreshold] = useState(lowStockThreshold);
  
  // Update temp threshold when the context threshold changes
  useEffect(() => {
    setTempThreshold(lowStockThreshold);
  }, [lowStockThreshold]);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleSave = () => {
    console.log('StockAlertSettings - Saving new threshold:', tempThreshold);
    setLowStockThreshold(tempThreshold);
    refreshNotifications();
    onClose();
  };

  const handleReset = () => {
    setTempThreshold(10);
    setEmailAlerts(false);
    setPushNotifications(true);
  };

  const lowStockCount = notifications.filter(n => n.type === 'low_stock').length;
  const outOfStockCount = notifications.filter(n => n.type === 'out_of_stock').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#003366] dark:text-[#4A90E2]" />
              <h3 className="text-lg font-semibold">Stock Alert Settings</h3>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={onClose}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Current Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Current Alerts
            </h4>
            <div className="flex gap-2">
              <Chip
                size="sm"
                color="warning"
                variant="flat"
                startContent={<AlertTriangle className="h-3 w-3" />}
              >
                {lowStockCount} Low Stock
              </Chip>
              <Chip
                size="sm"
                color="danger"
                variant="flat"
                startContent={<Package className="h-3 w-3" />}
              >
                {outOfStockCount} Out of Stock
              </Chip>
            </div>
          </div>

          {/* Low Stock Threshold */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Low Stock Threshold
            </h4>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                max="100"
                value={tempThreshold.toString()}
                onChange={(e) => setTempThreshold(parseInt(e.target.value) || 1)}
                label="Alert when stock is below"
                endContent="units"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Products with stock below this number will trigger low stock alerts.
            </p>
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Preview:</strong> With threshold of {tempThreshold}, you would have{' '}
                <strong>
                  {SAMPLE_PRODUCTS.filter(p => p.stock <= tempThreshold && p.stock > 0).length} low stock alerts
                </strong>{' '}
                and{' '}
                <strong>
                  {SAMPLE_PRODUCTS.filter(p => p.stock === 0).length} out of stock alerts
                </strong>
              </p>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Notification Preferences
            </h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Push Notifications
                </span>
              </div>
              <Switch
                isSelected={pushNotifications}
                onValueChange={setPushNotifications}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Email Alerts
                </span>
              </div>
              <Switch
                isSelected={emailAlerts}
                onValueChange={setEmailAlerts}
                size="sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="flat"
              onClick={handleReset}
              startContent={<RotateCcw className="h-4 w-4" />}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              color="primary"
              onClick={handleSave}
              startContent={<Save className="h-4 w-4" />}
              className="flex-1 bg-[#003366] hover:bg-[#004488]"
            >
              Save Settings
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
