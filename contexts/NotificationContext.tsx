"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addNewProductNotification: (productName: string, productId: string, isRestoration?: boolean) => void;
  clearAllNotifications: () => void;
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

  // Keys for persistence
  const STORAGE_KEYS = {
    notifications: 'app_notifications_v1',
    unread: 'app_notifications_unread_v1',
    threshold: 'lowStockThreshold',
    sessionTag: 'app_session_tag',
  };

  // Load from localStorage after mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.threshold);
      const threshold = saved ? parseInt(saved, 10) : 10;
      setLowStockThresholdState(threshold);

      // Restore persisted notifications
      try {
        const savedNotifsRaw = localStorage.getItem(STORAGE_KEYS.notifications);
        const savedUnreadRaw = localStorage.getItem(STORAGE_KEYS.unread);
        if (savedNotifsRaw) {
          const parsed: any[] = JSON.parse(savedNotifsRaw);
          // Revive timestamps
          const revived: Notification[] = parsed.map((n) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
          setNotifications(revived);
          if (savedUnreadRaw) setUnreadCount(parseInt(savedUnreadRaw, 10) || 0);
        }
      } catch {}

      // Tag this browsing session
      if (!localStorage.getItem(STORAGE_KEYS.sessionTag)) {
        localStorage.setItem(STORAGE_KEYS.sessionTag, String(Date.now()));
      }
    }
  }, []);

  // Persist notifications and unread count whenever they change
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.unread, String(unreadCount));
    } catch {}
  }, [notifications, unreadCount, isMounted]);

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
      
      // Update state immediately
      console.log('Updating notification state with new notifications:', newNotifications.length);
      updateNotificationState(newNotifications);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Set empty notifications if API fails
      setNotifications([]);
      setUnreadCount(0);
    }
  };


  const updateNotificationState = (notifications: Notification[]) => {
    // Merge with existing notifications so they aren't lost on refresh
    setNotifications((prev) => {
      const mergedMap = new Map<string, Notification>();

      // Start from previously saved notifications (persisted)
      for (const n of prev) {
        mergedMap.set(n.id, n);
      }

      // Add/replace with incoming notifications
      for (const n of notifications) {
        mergedMap.set(n.id, n);
      }

      const merged = Array.from(mergedMap.values());

      // Sort by timestamp (newest first)
      merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Update unread count based on merged list
      const unread = merged.filter((n) => !n.isRead).length;
      setUnreadCount(unread);

      return merged;
    });
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

  const addNewProductNotification = (productName: string, productId: string, isRestoration: boolean = false) => {
    // Only apply duplicate prevention for restorations, not new products
    if (isRestoration) {
      // Check if we already have a recent restoration notification for this product (within last 5 minutes)
      const recentThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
      const now = new Date();
      
      const hasRecentRestoration = notifications.some(notification => 
        notification.productId === parseInt(productId, 10) && 
        notification.type === 'system' &&
        notification.title === 'Product Restored' &&
        (now.getTime() - notification.timestamp.getTime()) < recentThreshold
      );

      // Don't create duplicate restoration notifications for the same product within 5 minutes
      if (hasRecentRestoration) {
        console.log(`Skipping restoration notification for ${productName} - recent restoration notification already exists`);
        return;
      }
    }

    const notificationTitle = isRestoration ? 'Product Restored' : 'New Product Added';
    const notificationMessage = isRestoration 
      ? `${productName} has been restored to your inventory.`
      : `${productName} has been added to your inventory.`;

    const newNotification: Notification = {
      id: `product_${isRestoration ? 'restored' : 'added'}_${productId}_${Date.now()}`,
      type: 'system',
      title: notificationTitle,
      message: notificationMessage,
      timestamp: new Date(),
      isRead: false,
      productId: parseInt(productId, 10),
      productName: productName
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      localStorage.removeItem(STORAGE_KEYS.notifications);
      localStorage.removeItem(STORAGE_KEYS.unread);
    } catch {}
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
    addNewProductNotification,
    clearAllNotifications,
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
