// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    backend: {
      // This path is relative to the public folder in a Next.js app
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false, // Set to false if you don't want to use Suspense
    },
  });

export default i18n;