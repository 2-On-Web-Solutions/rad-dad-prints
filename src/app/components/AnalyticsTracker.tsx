'use client';

import { useEffect } from 'react';

export default function AnalyticsTracker() {
  useEffect(() => {
    // Only ping once every 30 minutes
    const lastPing = localStorage.getItem('rdp_last_ping');
    const now = Date.now();

    if (lastPing && now - Number(lastPing) < 30 * 60 * 1000) {
      return;
    }

    localStorage.setItem('rdp_last_ping', String(now));

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname,
      }),
    });
  }, []);

  return null;
}