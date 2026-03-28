'use client';

/**
 * @fileOverview THE SYSTEM CLOCK (NUCLEAR REBUILT)
 * Eliminates all hydration errors by strictly waiting for client mount.
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

  // HYDRATION SHIELD: Return placeholder until client is ready.
  // This prevents "Text content does not match" warning.
  if (!isMounted || !time) {
    return <Skeleton className="h-6 w-[240px] bg-muted/20" />;
  }

  return (
    <div className="hidden sm:flex items-center text-sm font-black uppercase tracking-widest text-foreground h-6 w-[240px]">
      <span suppressHydrationWarning>{format(time, 'd MMMM yyyy, HH:mm:ss', { locale: fr })}</span>
    </div>
  );
}
