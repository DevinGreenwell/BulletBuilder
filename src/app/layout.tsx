// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from "@/components/auth/AuthProvider";
import Header from "@/components/auth/Header";
import MobileOptimization from "@/components/mobile/MobileOptimization";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
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
  metadataBase: new URL('https://www.BulletBuilder.net'),
  openGraph: {
    title: 'Bullet Builder 2.0',
    description: 'AI-Powered Evaluation Tool for USCG',
    url: 'https://www.BulletBuilder.net',
    siteName: 'Bullet Builder 2.0',
    images: [
      {
        url: '/logo.png',
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
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = { /* ... */ };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        {/* Wrap everything inside ThemeProvider with a single element */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Use a div or React Fragment as the single child */}
          <div>
            <SplashScreen />
            <AuthProvider>
              <MobileOptimization>
                <div className="app-layout">
                  <Header />
                  <main className="min-h-screen bg-card text-foreground pt-4 transition-colors duration-200">
                    {children}
                  </main>
                  <Toaster />
                </div>
              </MobileOptimization>
            </AuthProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}