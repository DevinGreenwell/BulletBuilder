'use client';

import React, { useState, useEffect } from 'react';
// Removed Mic and Button as they were unused
// import { Mic } from 'lucide-react'; 
// import { Button } from '@/components/ui/button';
import SpeechToText from './SpeechToText';

interface MobileSpeechButtonProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
}

export default function MobileSpeechButton({ 
  onTranscript, 
  isDisabled = false 
}: MobileSpeechButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show on smaller screens and add a nice entry animation
  useEffect(() => {
    // Check if it's a mobile device
    const isMobileDevice = window.innerWidth <= 768;
    
    if (isMobileDevice) {
      // Add a delay for a nicer entry
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // 1-second delay before appearing
      
      // Cleanup timer on component unmount
      return () => clearTimeout(timer);
    }
    // If not mobile, it remains not visible (or you can set isVisible to false explicitly)
    // For this component's logic, it seems it should only ever be visible on mobile.
  }, []); // Empty dependency array means this effect runs once on mount
  
  // If not set to be visible (e.g., on non-mobile or before timeout), render nothing
  if (!isVisible) return null;
  
  return (
    // This div provides the fixed positioning and entry animation
    <div className="fixed bottom-20 right-6 md:hidden z-10 animate-fade-in">
      {/* This div provides the circular background and shadow for the button */}
      <div className="bg-primary rounded-full shadow-lg p-1">
        {/* The actual SpeechToText component handling the speech functionality */}
        <SpeechToText 
          onTranscript={onTranscript}
          isDisabled={isDisabled}
          className="speech-btn-mobile mobile-tap-target" // Specific styling for the mobile button
        />
      </div>
    </div>
  );
}
