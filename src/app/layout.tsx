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


export const metadata: Metadata = { /* ... */ };
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
              <Header /> {/* Theme Toggle will be added inside Header */}
              <main className="min-h-screen bg-card text-foreground pt-4 transition-colors duration-200"> {/* Added transition */}
                {children}
              </main>
              <Toaster /> {/* Place Toaster inside ThemeProvider if used */}
            </MobileOptimization>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}