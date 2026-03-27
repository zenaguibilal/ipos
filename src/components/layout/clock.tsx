
'use client';

/**
 * @fileOverview Hydration-Safe Real-time Clock
 * Ensures no server/client mismatch by deferring rendering until mount.
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function Clock() {
  const [isMounted, setIsMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!isMounted || !time) {
    return <Skeleton className="h-6 w-[240px]" />;
  }

  return (
    <div className="hidden sm:flex items-center text-base font-medium text-foreground h-6 w-[240px]">
      <span>{format(time, 'd MMMM yyyy, HH:mm:ss', { locale: fr })}</span>
    </div>
  );
}
