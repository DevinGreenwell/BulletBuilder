// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from "@/components/auth/AuthProvider";
import Header from "@/components/auth/Header";
import MobileOptimization from "@/components/mobile/MobileOptimization";
import { ThemeProvider } from "next-themes"; // Import ThemeProvider
import { Toaster } from "@/components/ui/sonner"; // Import Toaster if you use it
import { Poppins } from 'next/font/google';
import './globals.css';

import SplashScreen from '@/components/SplashScreen';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Bullet Builder 2.0',
  description: 'AI-Powered Evaluation Tool for USCG',
  metadataBase: new URL('https://www.BulletBuilder.net'), // <- Your live domain
  openGraph: {
    title: 'Bullet Builder 2.0',
    description: 'AI-Powered Evaluation Tool for USCG',
    url: 'https://www.BulletBuilder.net', // <- Your live domain
    siteName: 'Bullet Builder 2.0',
    images: [
      {
        url: '/logo.png', // or whatever path to your logo or preview image
        width: 267,
        height: 240,
        alt: 'Bullet Builder 2.0',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bullet Builder 2.0',
    description: 'AI-Powered Evaluation Tool for USCG',
    images: ['/logo.png'], // same as above
  },
};

export const viewport: Viewport = { /* ... */ };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <SplashScreen />
        {/* Add ThemeProvider here */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MobileOptimization>
              {/* FIXED: Wrap all content in a single div */}
              <div className="app-layout">
                <Header /> {/* Theme Toggle will be added inside Header */}
                <main className="min-h-screen bg-card text-foreground pt-4 transition-colors duration-200"> {/* Added transition */}
                  {children}
                </main>
                <Toaster /> {/* Place Toaster inside ThemeProvider if used */}
              </div>
            </MobileOptimization>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}