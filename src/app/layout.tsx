import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';
import Header from '@/components/auth/Header';
import MobileOptimization from '@/components/mobile/MobileOptimization';
import SplashScreen from '@/components/SplashScreen';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

/* ----------  Metadata & viewport (unchanged) ---------- */
export const metadata: Metadata = {
  title: 'Bullet Builder 2.0',
  description: 'AI-Powered Evaluation Tool for USCG',
  metadataBase: new URL('https://www.BulletBuilder.net'),
  openGraph: {
    title: 'Bullet Builder 2.0',
    description: 'AI-Powered Evaluation Tool for USCG',
    url: 'https://www.BulletBuilder.net',
    siteName: 'Bullet Builder 2.0',
    images: [{ url: '/logo-512.png', width: 512, height: 512, alt: 'Bullet Builder 2.0' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bullet Builder 2.0',
    description: 'AI-Powered Evaluation Tool for USCG',
    images: ['/logo-512.png'],
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

/* ---------------------------  Layout  --------------------------- */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <SplashScreen>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <MobileOptimization>
                <div className="app-layout">
                  <Header />
                  <main className="min-h-screen bg-card pt-4 text-foreground transition-colors duration-200">
                    {children}
                  </main>
                  <Toaster />
                </div>
              </MobileOptimization>
            </AuthProvider>
          </ThemeProvider>
        </SplashScreen>
      </body>
    </html>
  );
}
