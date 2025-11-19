'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side to avoid hydration mismatch
    setTime(new Date());

    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) {
        // Render a placeholder or return an empty string on the server
        // and during the initial client-side render.
        return '00:00:00'; 
    }
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-base tracking-wider">
        {formatTime(time)}
      </span>
    </div>
  );
}
