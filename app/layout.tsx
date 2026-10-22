import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/components/providers/QueryProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'El Peque Hong Kong | Catálogo Digital',
    template: '%s | El Peque Hong Kong',
  },
  description:
    'Vitrina promocional y catálogo digital actualizado en tiempo real con disponibilidad de stock, variantes y ofertas.',
  icons: {
    icon: '/assets/img/logo.png',
    apple: '/assets/img/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafafa] text-zinc-900 selection:bg-zinc-900 selection:text-white">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#fafafa',
                fontSize: '13px',
                borderRadius: '8px',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
