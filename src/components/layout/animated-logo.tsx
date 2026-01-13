
'use client';

import { useState, useEffect } from 'react';

const words = ["iPOS", "POSi", "OSiP", "SiPO"];
const INTERVAL = 2000; // 2 seconds

export function AnimatedLogo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <span className="text-xl font-semibold transition-all duration-300 ease-in-out">
        {words[index]}
    </span>
  );
}
