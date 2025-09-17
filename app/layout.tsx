import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n'; // Adjust the import path as needed
import I18nProviderWrapper from '@/components/I18nProviderWrapper'
import ClientOnlyI18nProvider from '@/components/ClientOnlyI18nProvider';


export const metadata: Metadata = {
  title: 'Surge App',
  description: 'App that tracks your foods and their journey to your plate.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
      <ClientOnlyI18nProvider>
          {children}
        </ClientOnlyI18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
