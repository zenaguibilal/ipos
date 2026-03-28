'use client';

/**
 * @fileOverview THE SYSTEM CLOCK (NUCLEAR REBUILT)
 * Eliminates all hydration errors by strictly waiting for client mount validation.
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

  // HYDRATION SHIELD: Return atomic placeholder until client-side handshake is verified.
  // This prevents "Text content does not match" critical mismatch.
  if (!isMounted || !time) {
    return <div className="h-6 w-[240px] flex items-center"><Skeleton className="h-4 w-full bg-muted/20" /></div>;
  }

  return (
    <div className="hidden sm:flex items-center text-sm font-black uppercase tracking-widest text-foreground h-6 w-[240px] animate-in fade-in duration-500">
      <span suppressHydrationWarning>{format(time, 'd MMMM yyyy, HH:mm:ss', { locale: fr })}</span>
    </div>
  );
}
