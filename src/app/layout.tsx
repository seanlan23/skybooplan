import type { Metadata } from 'next'
import Script from 'next/script'
import { Plus_Jakarta_Sans, Syne, JetBrains_Mono } from 'next/font/google'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'
import { AppProviders } from '@/components/layout/AppProviders'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'skybooplan — Poišči let, načrtuj pot, rezerviraj namestitev',
  description: 'Napreden potovalni iskalnik z AI načrtovalcem poti in agregatorjem namestitev.',
  keywords: ['leti', 'iskalnik letov', 'potovanje', 'namestitve', 'AI potovalni načrtovalec'],
  openGraph: {
    title: 'skybooplan.com',
    description: 'Vse za tvoje potovanje na enem mestu.',
    url: 'https://skybooplan.com',
    siteName: 'skybooplan',
    locale: 'sl_SI',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Server render: privzeti lang="sl". LocaleProvider posodobi lang/dir na clientu iz localStorage.
  return (
    <html lang="sl" className={`${plusJakarta.variable} ${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Script
          src="https://emrldtp.com/NTMyOTE1.js?t=532915"
          strategy="afterInteractive"
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
