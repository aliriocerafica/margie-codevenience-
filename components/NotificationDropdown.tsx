"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { 
  Bell, 
  Package, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Clock,
  TrendingDown,
  ShoppingCart
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: { x: number; y: number } | null; // screen coordinates of the FAB's top-left corner
}

export default function NotificationDropdown({ isOpen, onClose, anchor }: NotificationDropdownProps) {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  useEffect(() => {
    // Add webkit scrollbar styles programmatically to avoid CSS conflicts
    const style = document.createElement('style');
    style.textContent = `
      .notification-scroll-container::-webkit-scrollbar {
        width: 6px;
      }
      .notification-scroll-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .notification-scroll-container::-webkit-scrollbar-thumb {
        background-color: rgb(203 213 225);
        border-radius: 3px;
      }
      .notification-scroll-container::-webkit-scrollbar-thumb:hover {
        background-color: rgb(156 163 175);
      }
      .dark .notification-scroll-container::-webkit-scrollbar-thumb {
        background-color: rgb(75 85 99);
      }
      .dark .notification-scroll-container::-webkit-scrollbar-thumb:hover {
        background-color: rgb(107 114 128);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out_of_stock':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'danger';
      case 'system':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  // Compute dynamic position near the floating bell and keep within viewport horizontally
  let wrapperStyle: React.CSSProperties | undefined;
  let panelWidth = 384; // default 24rem
  if (typeof window !== 'undefined') {
    panelWidth = Math.min(360, Math.max(280, window.innerWidth - 16)); // 16px margin
  }
  if (anchor) {
    const margin = 8;
    const fabSize = 56;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const fabCenterX = anchor.x + fabSize / 2;
    const desiredLeft = fabCenterX - panelWidth / 2;
    const clampedLeft = Math.min(Math.max(margin, desiredLeft), viewportWidth - panelWidth - margin);

    const placeAbove = anchor.y > viewportHeight / 2;

    const base: React.CSSProperties = {
      left: clampedLeft,
      width: panelWidth,
    };
    if (placeAbove) {
      // Position using bottom so the panel sits fully above the bell regardless of its height
      base.bottom = Math.max(margin, viewportHeight - anchor.y + 12);
    } else {
      // Place below the bell
      base.top = anchor.y + fabSize + 12;
    }

    wrapperStyle = base;
  }

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in-0 duration-200" onClick={onClose}>
      <div
        className="fixed max-h-[calc(100vh-8rem)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in-0 duration-300 ease-out"
        style={wrapperStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl transform transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="pb-2 animate-in slide-in-from-top-2 fade-in-0 duration-400 delay-100">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#003366] dark:text-[#4A90E2]" />
                <h3 className="text-lg font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Chip size="sm" color="danger" variant="flat" className="animate-in zoom-in-50 fade-in-0 duration-300 delay-200">
                    {unreadCount}
                  </Chip>
                )}
              </div>
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2 fade-in-0 duration-400 delay-150">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    onClick={markAllAsRead}
                    className="text-xs hover:scale-105 transition-transform duration-200 animate-in zoom-in-50 fade-in-0 duration-300 delay-250"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={onClose}
                  className="hover:scale-110 hover:rotate-90 transition-all duration-200 animate-in zoom-in-50 fade-in-0 duration-300 delay-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0 animate-in slide-in-from-bottom-2 fade-in-0 duration-500 delay-200">
            <div 
              className="max-h-96 overflow-y-auto notification-scroll-container"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(203 213 225) transparent',
              }}
            >
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 animate-in zoom-in-50 fade-in-0 duration-400 delay-300">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50 animate-in zoom-in-75 fade-in-0 duration-500 delay-400" />
                <p className="animate-in slide-in-from-bottom-1 fade-in-0 duration-400 delay-500">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 transform animate-in slide-in-from-left-2 fade-in-0 duration-400 will-change-transform ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                    style={{
                      animationDelay: `${300 + index * 100}ms`
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1 animate-in zoom-in-50 fade-in-0 duration-300" style={{ animationDelay: `${400 + index * 100}ms` }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 animate-in slide-in-from-right-1 fade-in-0 duration-300" style={{ animationDelay: `${350 + index * 100}ms` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white animate-in slide-in-from-left-1 fade-in-0 duration-300" style={{ animationDelay: `${400 + index * 100}ms` }}>
                            {notification.title}
                          </h4>
                          <Chip
                            size="sm"
                            color={getNotificationColor(notification.type)}
                            variant="flat"
                            className="animate-in zoom-in-50 fade-in-0 duration-300"
                            style={{ animationDelay: `${450 + index * 100}ms` }}
                          >
                            {notification.type.replace('_', ' ')}
                          </Chip>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-in zoom-in-50 fade-in-0 duration-300" style={{ animationDelay: `${475 + index * 100}ms` }}></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 animate-in slide-in-from-left-1 fade-in-0 duration-300" style={{ animationDelay: `${475 + index * 100}ms` }}>
                          {notification.message}
                        </p>
                        {notification.currentStock !== undefined && (
                          <div className="flex items-center gap-2 mb-2 animate-in slide-in-from-left-1 fade-in-0 duration-300" style={{ animationDelay: `${475 + index * 100}ms` }}>
                            <Package className="h-3 w-3 text-gray-400 animate-in zoom-in-50 fade-in-0 duration-300" style={{ animationDelay: `${500 + index * 100}ms` }} />
                            <span className="text-xs text-gray-500 animate-in slide-in-from-right-1 fade-in-0 duration-300" style={{ animationDelay: `${500 + index * 100}ms` }}>
                              Current stock: {notification.currentStock} units
                            </span>
                            {notification.threshold && (
                              <span className="text-xs text-gray-500 animate-in slide-in-from-right-1 fade-in-0 duration-300" style={{ animationDelay: `${525 + index * 100}ms` }}>
                                (Threshold: {notification.threshold})
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400 animate-in slide-in-from-bottom-1 fade-in-0 duration-300" style={{ animationDelay: `${500 + index * 100}ms` }}>
                          <Clock className="h-3 w-3 animate-in zoom-in-50 fade-in-0 duration-300" style={{ animationDelay: `${525 + index * 100}ms` }} />
                          <span className="animate-in slide-in-from-right-1 fade-in-0 duration-300" style={{ animationDelay: `${550 + index * 100}ms` }}>
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
