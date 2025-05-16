'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FaCoffee } from 'react-icons/fa';

export default function BuyMeCoffeeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Show the dialog automatically on first load after a short delay
  // Using useEffect instead of useState for side effects
  useEffect(() => {
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, 3000); // 3 seconds delay
      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"
      >
        <FaCoffee className="h-4 w-4" />
        <span>Buy Me Coffee</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaCoffee className="h-5 w-5 text-amber-500" />
              <span>Support This Project</span>
            </DialogTitle>
            <DialogDescription>
              If you find this USCG Evaluation Report Generator useful, consider buying me a coffee!
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">This tool was created to help USCG personnel streamline their evaluation report process. Your support helps keep it running and improving!</p>
            
            <div className="flex justify-center my-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <p className="text-blue-800 font-medium mb-2">Venmo</p>
                <p className="text-blue-600 font-bold">@Devin-Greenwell-1</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Maybe Later
            </Button>
            <Button 
              onClick={() => {
                window.open('https://venmo.com/Devin-Greenwell-1', '_blank');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Open Venmo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
