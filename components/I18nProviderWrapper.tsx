// components/I18nProviderWrapper.tsx
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n'; // Ensure this path is correct

export default function I18nProviderWrapper({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}