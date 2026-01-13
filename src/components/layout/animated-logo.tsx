
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const word = "iPOS";
const permutations = [
  [0, 1, 2, 3], // iPOS
  [3, 0, 1, 2], // SiPO
  [2, 3, 0, 1], // OSiP
  [1, 2, 3, 0], // POSi
];
const INTERVAL = 2500; // 2.5 seconds

export function AnimatedLogo() {
  const [permIndex, setPermIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPermIndex((prevIndex) => (prevIndex + 1) % permutations.length);
    }, INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const currentPermutation = permutations[permIndex];
  const charWidth = 12; // Approximate width of a character in pixels

  return (
    <div
      className="relative text-xl font-semibold transition-all duration-300 ease-in-out"
      style={{ width: `${word.length * charWidth}px`, height: '24px' }}
    >
      {word.split('').map((char, index) => {
        // Find where the current character (at `index`) should move to
        const newPositionIndex = currentPermutation.indexOf(index);
        
        return (
          <span
            key={index}
            className="absolute transition-all duration-700 ease-in-out"
            style={{
              left: `${newPositionIndex * charWidth}px`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}
