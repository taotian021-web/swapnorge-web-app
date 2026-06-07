'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsShown(true);
      // Hide after 3 seconds when coming back online
      const timer = setTimeout(() => setIsShown(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsShown(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isShown) return null;

  return (
    <div
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {!isOnline && <WifiOff className="h-4 w-4" />}
      <span className="text-sm font-semibold">
        {isOnline ? '🎉 You\'re back online!' : '📡 You\'re offline'}
      </span>
    </div>
  );
}
