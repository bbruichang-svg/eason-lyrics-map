'use client';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './en';
import zhCN from './zh-CN';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    supportedLngs: ['en', 'zh-CN'],
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });

export default i18n;