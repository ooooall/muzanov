import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { NavigationProgress } from '@/components/shared/NavigationProgress'
import './globals.css'

export const metadata: Metadata = {
  title: 'QUARTERS · Operations Control',
  description: 'Real-time apartment operations management',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quarters',
    startupImage: [],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
  // Dark status bar so it blends with the header background
  themeColor: '#1e1e26',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-base text-text-1 font-sans antialiased">
        <NavigationProgress />
        {children}
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid rgba(15,23,42,0.12)',
              color: '#0f172a',
              fontFamily: 'ui-monospace, SF Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.03em',
            },
          }}
        />
      </body>
    </html>
  )
}
