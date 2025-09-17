// components/ClientOnlyI18nProvider.tsx

'use client';
import { useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n'; // Assuming this is your i18n config file

export default function ClientOnlyI18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a non-localized fallback on the server
    return <>{children}</>; 
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}