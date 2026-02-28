'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function Clock() {
  const [isMounted, setIsMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="hidden sm:flex items-center text-base font-medium text-foreground h-6 w-[240px]">
      {isMounted ? (
        <span>{format(time, 'd MMMM yyyy, HH:mm:ss', { locale: fr })}</span>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  );
}
