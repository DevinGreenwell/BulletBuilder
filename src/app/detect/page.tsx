'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DetectMobile() {
  const router = useRouter();
  
  useEffect(() => {
    // Simple mobile detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                    (window.innerWidth <= 768);
    
    if (isMobile) {
      router.push('/mobile-redirect');
    } else {
      router.push('/');
    }
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Detecting your device...</p>
    </div>
  );
}
