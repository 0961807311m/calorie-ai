import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UpdateBanner } from '@/components/UpdateBanner';
import { ToastProvider } from '@/lib/useToast';

export const metadata: Metadata = {
  title: 'CalorieAI — Розумний щоденник калорій',
  description: 'Розпізнай калорії за фото з ШІ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CalorieAI',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#07070c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <UpdateBanner />
            {children}
          </ToastProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}