import { useEffect } from 'react';

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

export const useScreenWakeLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const wakeLockApi = (navigator as NavigatorWithWakeLock).wakeLock;
    if (!wakeLockApi?.request) return;

    let wakeLock: WakeLockSentinelLike | null = null;
    let requestInFlight = false;
    let shouldReacquire = true;

    const requestWakeLock = async () => {
      if (requestInFlight || !shouldReacquire) return;
      if (document.visibilityState !== 'visible') return;
      if (wakeLock && !wakeLock.released) return;

      requestInFlight = true;

      try {
        wakeLock = await wakeLockApi.request('screen');
        wakeLock.addEventListener('release', handleWakeLockRelease);
      } catch {
        // Ignore: unsupported context, missing user gesture, or low battery mode.
      } finally {
        requestInFlight = false;
      }
    };

    const handleWakeLockRelease = () => {
      if (!shouldReacquire) return;
      void requestWakeLock();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
      }
    };

    const handleUserInteraction = () => {
      void requestWakeLock();
    };

    void requestWakeLock();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      shouldReacquire = false;

      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);

      if (wakeLock && !wakeLock.released) {
        void wakeLock.release();
      }
    };
  }, [enabled]);
};
