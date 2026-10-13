import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Keeps the screen on while `isActive` is true.
 *
 * Browsers release the lock whenever the page is hidden (switching apps, locking the
 * phone). `isActive` is what the user chose, so the lock is taken again when the page is
 * visible; only the user turning it off sets `isActive` to false.
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!isSupported || wakeLockRef.current) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      wakeLockRef.current = lock;
      lock.addEventListener('release', () => {
        if (wakeLockRef.current === lock) wakeLockRef.current = null;
      });
    } catch (err) {
      // Refused, e.g. low battery or the page is hidden; retried when it becomes visible
      console.warn('Wake lock not granted:', err);
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isActive) return;
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [isActive, acquire]);

  const toggleWakeLock = useCallback(() => setIsActive(active => !active), []);

  return { isActive, isSupported, toggleWakeLock };
}
