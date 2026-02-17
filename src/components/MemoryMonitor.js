import { useEffect, useState } from 'react';

const MB = 1024 * 1024;
const LOG_INTERVAL = 30_000; // log every 30 seconds

function formatMB(bytes) {
  return (bytes / MB).toFixed(1) + ' MB';
}

/**
 * Memory monitor — logs heap usage to the console every 30s.
 * Enable on-screen overlay: localStorage.setItem('debugMemory', 'true')
 * Disable: localStorage.removeItem('debugMemory')
 *
 * Requires Chromium's performance.memory API (non-standard but available on Pi's Chromium).
 * Launch Chromium with --enable-precise-memory-info for more accurate numbers.
 */
export default function MemoryMonitor() {
  const [memInfo, setMemInfo] = useState(null);
  const showOverlay = localStorage.getItem('debugMemory') === 'true';

  useEffect(() => {
    if (!performance.memory) {
      console.warn('performance.memory not available — memory monitoring disabled');
      return;
    }

    const log = () => {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const info = {
        used: usedJSHeapSize,
        total: totalJSHeapSize,
        limit: jsHeapSizeLimit,
      };

      console.log(
        `[Memory] Used: ${formatMB(info.used)} | Total: ${formatMB(info.total)} | Limit: ${formatMB(info.limit)} | ${new Date().toLocaleTimeString()}`
      );

      setMemInfo(info);
    };

    log(); // log immediately
    const interval = setInterval(log, LOG_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (!showOverlay || !memInfo) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 4,
      left: 4,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.7)',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: '4px 8px',
      borderRadius: 4,
      pointerEvents: 'none',
    }}>
      Heap: {formatMB(memInfo.used)} / {formatMB(memInfo.total)} (limit {formatMB(memInfo.limit)})
    </div>
  );
}
