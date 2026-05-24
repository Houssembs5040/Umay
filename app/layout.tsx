import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { I18nProvider } from '@/lib/i18n-context';
import { ThemeProvider } from '@/lib/theme-context';
import './globals.css';

const geist = Geist({ 
  subsets: ['latin'], 
  variable: '--font-geist' 
});

const geistMono = Geist_Mono({ 
  subsets: ['latin'], 
  variable: '--font-geist-mono' 
});

export const metadata: Metadata = {
  title: 'UmayB - Suivi de Grossesse',
  description: 'Suivez votre grossesse avec amour et douceur. App kawaii pour futures mamans.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <I18nProvider>
            {children}
            <Analytics />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}