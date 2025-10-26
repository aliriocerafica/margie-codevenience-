"use client";

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
  Chip,
  Select,
  SelectItem,
} from '@heroui/react';
import { 
  Settings, 
  AlertTriangle, 
  Package, 
  Bell,
  Save,
  RotateCcw,
  Mail,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

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
  const [thresholdInput, setThresholdInput] = useState(lowStockThreshold.toString());
  
  // Update temp threshold when the context threshold changes
  useEffect(() => {
    setTempThreshold(lowStockThreshold);
    setThresholdInput(lowStockThreshold.toString());
  }, [lowStockThreshold]);
  
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [useDefaultEmail, setUseDefaultEmail] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailConfig, setEmailConfig] = useState({
    configured: false,
    hasUser: false,
    hasPass: false,
    host: 'smtp.gmail.com',
    port: 587
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState({
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0
  });
  const [previewLoading, setPreviewLoading] = useState(false);

  // Notification function similar to AddProductModal
  const showNotification = ({ title, description, type }: { title: string; description: string; type: 'success' | 'error' }) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-800'
      : 'bg-red-50 border border-red-200 text-red-800'
      }`;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          ${type === 'success'
        ? '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      }
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-sm">${title}</h4>
          <p class="text-sm mt-1">${description}</p>
        </div>
        <button class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  };

  // Load email settings from server on component mount
  useEffect(() => {
    loadUserSettings();
    checkEmailConfiguration();
    loadPreviewData();
  }, []);

  // Update preview when threshold changes
  useEffect(() => {
    loadPreviewData();
  }, [tempThreshold]);

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/email/user-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setEmailAddress(data.settings.emailAddress || '');
          setEmailAlerts(data.settings.emailAlerts || false);
          setPushNotifications(data.settings.pushNotifications !== false);
          setUseDefaultEmail(data.settings.useDefaultEmail !== false);
          setTempThreshold(data.settings.lowStockThreshold || lowStockThreshold);
          setThresholdInput((data.settings.lowStockThreshold || lowStockThreshold).toString());
        }
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const loadPreviewData = async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/products/stock-alerts?threshold=${tempThreshold}&sendEmail=false`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreviewData({
            lowStockCount: data.summary.lowStockCount,
            outOfStockCount: data.summary.outOfStockCount,
            totalProducts: data.summary.total
          });
        }
      }
    } catch (error) {
      console.error('Failed to load preview data:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const checkEmailConfiguration = async () => {
    try {
      const response = await fetch('/api/email/config');
      if (response.ok) {
        const config = await response.json();
        setEmailConfig(config);
      }
    } catch (error) {
      console.error('Failed to check email configuration:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      console.log('StockAlertSettings - Saving new threshold:', tempThreshold);
      setLowStockThreshold(tempThreshold);
      
      // Save all settings to server
      const response = await fetch('/api/email/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailAddress: useDefaultEmail ? '' : emailAddress,
          emailAlerts,
          pushNotifications,
          useDefaultEmail,
          lowStockThreshold: tempThreshold
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save email settings');
      }
      
      refreshNotifications();
      
      // Send stock alert email if there are alerts and email alerts are enabled
      if (emailAlerts) {
        try {
          await fetch(`/api/products/stock-alerts?threshold=${tempThreshold}&sendEmail=true`, {
            method: 'GET'
          });
        } catch (error) {
          console.error('Failed to send stock alert email:', error);
        }
      } else {
        console.log('Email alerts disabled - no email will be sent');
      }
      
      // Show success notification
      showNotification({
        title: 'Settings Saved Successfully',
        description: 'Your stock alert settings have been updated and saved.',
        type: 'success'
      });
      
      // Close modal immediately after showing notification
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      
      // Show error notification
      showNotification({
        title: 'Failed to Save Settings',
        description: 'There was an error saving your settings. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    // Reset to original server settings
    await loadUserSettings();
  };

  const handleClose = async () => {
    // Reset to original server settings when closing without saving
    await loadUserSettings();
    onClose();
  };

  const lowStockCount = notifications.filter(n => n.type === 'low_stock').length;
  const outOfStockCount = notifications.filter(n => n.type === 'out_of_stock').length;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border-none",
        header: "border-b border-gray-200 dark:border-gray-700",
        footer: "border-t border-gray-200 dark:border-gray-700",
        closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#003366] dark:text-[#4A90E2]" />
            <span className="text-lg font-semibold">General Settings</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
            Configure application preferences including stock alerts and notifications
          </p>
        </ModalHeader>
        
        <ModalBody className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Threshold & Current Status */}
            <div className="space-y-4">
              {/* Current Status */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Current Alerts
                </h3>
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
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Low Stock Threshold
                </h3>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholdInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setThresholdInput(value);
                    
                    // Update tempThreshold if it's a valid number
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 1) {
                      setTempThreshold(numValue);
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure we have a valid value when user leaves the field
                    const value = e.target.value;
                    const numValue = parseInt(value);
                    
                    if (value === '' || isNaN(numValue) || numValue < 1) {
                      setTempThreshold(1);
                      setThresholdInput('1');
                    } else {
                      setTempThreshold(numValue);
                      setThresholdInput(numValue.toString());
                    }
                  }}
                  placeholder="Enter threshold value"
                  isRequired
                  fullWidth
                  size="md"
                  endContent="units"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-10 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-700 dark:border-gray-600"
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Products with stock below this number will trigger low stock alerts. Stock equal to the threshold will not trigger alerts.
                </p>
                
                {/* Preview */}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  {previewLoading ? (
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Preview:</strong> Loading preview data...
                    </p>
                  ) : (
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Preview:</strong> With threshold of {tempThreshold}, you would have{' '}
                      <strong>{previewData.lowStockCount} low stock alerts</strong> (stock &lt; {tempThreshold}) and{' '}
                      <strong>{previewData.outOfStockCount} out of stock alerts</strong>
                      {' '}(out of {previewData.totalProducts} total products)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Notifications */}
            <div className="space-y-4">
              {/* Email Configuration Status */}
              {!emailConfig.configured && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Email Service Not Configured
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Contact your administrator to set up email notifications.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email Alerts</span>
                    <Switch
                      isSelected={emailAlerts}
                      onValueChange={setEmailAlerts}
                      size="sm"
                      isDisabled={!emailConfig.configured}
                    />
                  </div>

                  {emailAlerts && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Use Default Email</span>
                        <Switch
                          isSelected={useDefaultEmail}
                          onValueChange={(value) => {
                            setUseDefaultEmail(value);
                            // Clear custom email when switching to default
                            if (value) {
                              setEmailAddress('');
                            }
                          }}
                          size="sm"
                          isDisabled={!emailConfig.configured}
                        />
                      </div>

                      {!useDefaultEmail && (
                        <div>
                          <Input
                            type="email"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            placeholder="Enter custom email address"
                            isRequired
                            fullWidth
                            size="sm"
                            isDisabled={!emailConfig.configured}
                            startContent={<Mail className="w-4 h-4 text-[#003366] dark:text-[#4A90E2]" />}
                            classNames={{
                              input: "text-sm",
                              inputWrapper: "h-9 border-2 border-gray-200 hover:border-[#003366] focus-within:border-[#003366] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-700 dark:border-gray-600"
                            }}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Enter your custom email address to receive alerts.
                          </p>
                        </div>
                      )}

                      {/* Email Configuration Info */}
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {useDefaultEmail 
                              ? "Alerts will be sent to the default system email address."
                              : emailAddress.trim() 
                                ? `Alerts will be sent to: ${emailAddress}`
                                : "Please enter a custom email address to receive alerts."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Push Notifications */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Other Notifications
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                  <Switch
                    isSelected={pushNotifications}
                    onValueChange={setPushNotifications}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validation Indicator - Full Width */}
          {emailAlerts && !useDefaultEmail && !emailAddress.trim() && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Custom Email Required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Please enter a custom email address to receive alerts, or enable "Use Default Email" to use the system email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="mt-4 text-center text-sm p-3 rounded-lg shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Settings saved successfully! 🎉
              </div>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="mt-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 text-center text-sm p-3 rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed to save settings. Please try again.
              </div>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter className="justify-between">
          <Button 
            variant="light" 
            onPress={handleReset}
            disabled={isLoading}
            startContent={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="light" 
              onPress={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isLoading}
              startContent={!isLoading ? <Save className="w-4 h-4" /> : null}
              className="bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366] text-white"
              disabled={isLoading || (emailAlerts && !useDefaultEmail && !emailAddress.trim())}
            >
              {isLoading ? "Saving Settings..." : "Save Settings"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
