"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

export default function FloatingNotificationButton() {
  const [isMounted, setIsMounted] = useState(false);
  const { unreadCount, isNotificationOpen, openNotification, closeNotification } = useNotifications();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Floating Notification Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <Button
            variant="shadow"
            isIconOnly
            onClick={openNotification}
            className={`bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
              unreadCount > 0 ? 'animate-pulse' : ''
            }`}
            size="lg"
            title="Notifications"
          >
            <Bell className={`h-6 w-6 transition-transform duration-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center min-w-6 text-[11px] font-bold z-10 shadow-md animate-in slide-in-from-top-1 fade-in-0 duration-300 hover:scale-110 transition-transform">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={isNotificationOpen} 
        onClose={closeNotification} 
      />
    </>
  );
}
