
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="hidden sm:flex items-center text-base font-medium text-foreground">
      <span>{format(time, 'd MMMM yyyy, HH:mm:ss', { locale: fr })}</span>
    </div>
  );
}
