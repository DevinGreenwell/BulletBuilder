'use client';

import { useEffect } from 'react';

export default function MobileOptimization({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add touch action styles for better mobile experience
    document.documentElement.style.touchAction = 'manipulation';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document.documentElement.style['webkitTapHighlightColor' as any] = 'rgba(0,0,0,0)';
    
    // Force layout recalculation on mobile
    document.body.style.display = 'none';
    setTimeout(() => {
      document.body.style.display = 'block';
    }, 10);
    
  }, []);
  
  return <>{children}</>;
}
