// utils/browserDetection.ts
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Check for common in-app browsers
  const inAppBrowsers = [
    'fban', // Facebook
    'fbav', // Facebook
    'instagram',
    'linkedin', // LinkedIn
    'twitter',
    'line/', // LINE
    'wechat', // WeChat
    'micromessenger', // WeChat
    'tiktok',
    'snapchat'
  ];
  
  return inAppBrowsers.some(browser => userAgent.includes(browser));
}

export function getInAppBrowserName(): string {
  if (typeof window === 'undefined') return '';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('linkedin')) return 'LinkedIn';
  if (userAgent.includes('fban') || userAgent.includes('fbav')) return 'Facebook';
  if (userAgent.includes('instagram')) return 'Instagram';
  if (userAgent.includes('twitter')) return 'Twitter';
  if (userAgent.includes('tiktok')) return 'TikTok';
  
  return 'this app';
}

// components/InAppBrowserWarning.tsx
import React from 'react';

interface InAppBrowserWarningProps {
  browserName: string;
}

export function InAppBrowserWarning({ browserName }: InAppBrowserWarningProps) {
  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h2 className="text-lg font-semibold text-yellow-800 mb-4">
        Sign-in Not Available in {browserName}
      </h2>
      
      <p className="text-yellow-700 mb-4">
        For security reasons, Google sign-in doesn't work in {browserName}'s built-in browser.
      </p>
      
      <div className="space-y-3">
        <p className="text-sm font-medium text-yellow-800">
          Please open this page in your device's default browser:
        </p>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={copyCurrentUrl}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 hover:bg-yellow-200 transition-colors"
          >
            📋 Copy Link
          </button>
          
          <div className="text-xs text-yellow-600">
            Then paste it in Safari (iOS) or Chrome (Android)
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-100 rounded text-sm text-yellow-700">
        <strong>Steps:</strong>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Tap "Copy Link" above</li>
          <li>Open Safari or Chrome</li>
          <li>Paste the link in the address bar</li>
          <li>Sign in normally</li>
        </ol>
      </div>
    </div>
  );
}