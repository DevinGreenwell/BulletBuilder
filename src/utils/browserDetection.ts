// src/utils/browserDetection.ts
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