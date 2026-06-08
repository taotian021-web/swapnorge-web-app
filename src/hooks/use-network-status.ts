'use client';

import { useEffect, useState } from 'react';

/**
 * 🔧 Phase 4: Network Status Hook
 * 
 * Monitors network connectivity and provides offline support
 */

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
  saveData?: boolean;
}

// Type definition for Navigator.connection
interface NavigatorConnection {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  saveData: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
}

/**
 * Hook to monitor network status
 * Returns true if online, false if offline
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: undefined,
    saveData: undefined,
  });

  useEffect(() => {
    // Get initial network info if available
    const updateNetworkStatus = () => {
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || nav.mozConnection;
      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        saveData: connection?.saveData,
      });
    };

    // Update on online/offline events
    const handleOnline = () => {
      setNetworkStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setNetworkStatus((prev) => ({ ...prev, isOnline: false }));
    };

    // Update on connection change
    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}

/**
 * Simple hook that returns just the online/offline boolean
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}
