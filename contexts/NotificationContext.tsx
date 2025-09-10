"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SAMPLE_PRODUCTS } from '@/lib/constants';

interface Notification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  productId?: number;
  productName?: string;
  currentStock?: number;
  threshold?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isNotificationOpen: boolean;
  openNotification: () => void;
  closeNotification: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  forceUpdateNotifications: (threshold: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Load threshold from localStorage or default to 10
  const [lowStockThreshold, setLowStockThresholdState] = useState(10);

  // Load from localStorage after mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lowStockThreshold');
      const threshold = saved ? parseInt(saved, 10) : 10;
      console.log('NotificationContext - Initial threshold loaded:', threshold, 'from localStorage:', saved);
      setLowStockThresholdState(threshold);
    }
  }, []);

  // Custom setter that also saves to localStorage and regenerates notifications
  const setLowStockThreshold = (threshold: number) => {
    console.log('NotificationContext - Setting threshold to:', threshold);
    console.log('NotificationContext - Current state threshold before update:', lowStockThreshold);
    
    setLowStockThresholdState(threshold);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lowStockThreshold', threshold.toString());
      console.log('NotificationContext - Saved to localStorage:', threshold);
    }
    
    // Immediately regenerate notifications with the new threshold (async)
    console.log('NotificationContext - Regenerating notifications with threshold:', threshold);
    generateNotifications(threshold).catch(error => {
      console.error('Error generating notifications:', error);
    });
  };

  const generateNotifications = async (currentThreshold?: number) => {
    const threshold = currentThreshold ?? lowStockThreshold;
    console.log('NotificationContext - generateNotifications called with threshold:', threshold);
    
    try {
      // Fetch products from database
      console.log('Fetching products from database...');
      const response = await fetch(`/api/products/stock-alerts?threshold=${threshold}`);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Database products fetched:', data.summary);
      
      const newNotifications: Notification[] = [];
      
      // Create notifications for out of stock products
      data.alerts.outOfStock.forEach((product: any) => {
        newNotifications.push({
          id: `out_of_stock_${product.id}`,
          type: 'out_of_stock',
          title: 'Product Out of Stock',
          message: `${product.name} is completely out of stock and needs immediate restocking.`,
          timestamp: new Date(),
          isRead: false,
          productId: product.id,
          productName: product.name,
          currentStock: product.stock
        });
      });
      
      // Create notifications for low stock products
      data.alerts.lowStock.forEach((product: any) => {
        newNotifications.push({
          id: `low_stock_${product.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low on stock (${product.stock} units remaining). Consider restocking soon.`,
          timestamp: new Date(),
          isRead: false,
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          threshold: threshold
        });
      });
      
      console.log(`Generated ${newNotifications.length} stock notifications (${data.alerts.lowStock.length} low stock, ${data.alerts.outOfStock.length} out of stock)`);
      
      // Add system notifications
      addSystemNotifications(newNotifications);
      
      // Update state immediately
      console.log('Updating notification state with new notifications:', newNotifications.length);
      updateNotificationState(newNotifications);
      
    } catch (error) {
      console.error('Error fetching products from database, falling back to sample data:', error);
      
      // Fallback to sample data if API fails
      const fallbackNotifications: Notification[] = [];
      SAMPLE_PRODUCTS.forEach(product => {
        if (product.stock === 0) {
          fallbackNotifications.push({
            id: `out_of_stock_${product.id}`,
            type: 'out_of_stock',
            title: 'Product Out of Stock (Sample)',
            message: `${product.name} is completely out of stock and needs immediate restocking.`,
            timestamp: new Date(),
            isRead: false,
            productId: product.id,
            productName: product.name,
            currentStock: product.stock
          });
        } else if (product.stock <= threshold && product.stock > 0) {
          fallbackNotifications.push({
            id: `low_stock_${product.id}`,
            type: 'low_stock',
            title: 'Low Stock Alert (Sample)',
            message: `${product.name} is running low on stock (${product.stock} units remaining). Consider restocking soon.`,
            timestamp: new Date(),
            isRead: false,
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            threshold: threshold
          });
        }
      });
      
      // Add system notifications to fallback
      addSystemNotifications(fallbackNotifications);
      
      // Update state with fallback
      updateNotificationState(fallbackNotifications);
    }
  };

  const addSystemNotifications = (notifications: Notification[]) => {
    // Add some system notifications
    notifications.push({
      id: 'system_1',
      type: 'system',
      title: 'Weekly Inventory Report',
      message: 'Your weekly inventory report is ready for review.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false
    });

    notifications.push({
      id: 'system_2',
      type: 'system',
      title: 'New Product Added',
      message: 'A new product has been added to your inventory.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: true
    });
  };

  const updateNotificationState = (notifications: Notification[]) => {
    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(notifications);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unreadCount);
  };

  const openNotification = () => {
    setIsNotificationOpen(true);
  };
  const closeNotification = () => {
    setIsNotificationOpen(false);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  const refreshNotifications = async () => {
    console.log('NotificationContext - refreshNotifications called with threshold:', lowStockThreshold);
    try {
      await generateNotifications(lowStockThreshold);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const forceUpdateNotifications = async (threshold: number) => {
    console.log('NotificationContext - forceUpdateNotifications called with threshold:', threshold);
    // Clear existing notifications first
    console.log('Clearing existing notifications...');
    setNotifications([]);
    setUnreadCount(0);
    
    // Small delay to ensure state is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate new ones
    try {
      console.log('Generating new notifications...');
      await generateNotifications(threshold);
    } catch (error) {
      console.error('Error force updating notifications:', error);
    }
  };

  // Generate notifications on mount and when threshold changes
  useEffect(() => {
    if (isMounted) {
      console.log('NotificationContext - Generating notifications, threshold:', lowStockThreshold);
      generateNotifications(lowStockThreshold).catch(error => {
        console.error('Error generating notifications in useEffect:', error);
      });
    }
  }, [lowStockThreshold, isMounted]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    if (isMounted) {
      const interval = setInterval(() => {
        generateNotifications(lowStockThreshold).catch(error => {
          console.error('Error in auto-refresh:', error);
        });
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [lowStockThreshold, isMounted]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isNotificationOpen,
    openNotification,
    closeNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    lowStockThreshold,
    setLowStockThreshold,
    forceUpdateNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
