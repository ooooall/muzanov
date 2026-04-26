import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
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
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-base text-text-1 font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: '#151515',
              border: '1px solid rgba(255,255,255,0.11)',
              color: '#f5f5f5',
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
