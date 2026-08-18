import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export type ConnectionStatus =
  | 'online'
  | 'offline'
  | 'syncing'
  | 'pending'
  | 'synced'
  | 'failed';

const HEARTBEAT_INTERVAL_MS = 15000;

export function useConnectivity(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkConnectivity = async () => {
      if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
        return;
      }

      if (!navigator.onLine) {
        if (mountedRef.current) setStatus('offline');
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch(window.location.origin, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (mountedRef.current) setStatus('online');
      } catch {
        if (mountedRef.current) setStatus('offline');
      }
    };

    checkConnectivity();

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      const handleOffline = () => { if (mountedRef.current) setStatus('offline'); };
      const handleOnline = () => { checkConnectivity(); };
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);

      const intervalId = setInterval(checkConnectivity, HEARTBEAT_INTERVAL_MS);

      return () => {
        mountedRef.current = false;
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
        clearInterval(intervalId);
      };
    }

    return () => { mountedRef.current = false; };
  }, []);

  return status;
}
