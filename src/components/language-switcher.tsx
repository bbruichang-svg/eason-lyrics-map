'use client';

import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language ?? 'zh-CN';

  const toggle = () => {
    const next = current.startsWith('zh') ? 'en' : 'zh-CN';
    void i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className="text-muted-foreground text-xs font-medium px-2 py-1 rounded-full hover:text-foreground transition-colors"
      style={{ background: 'var(--glass-bg)' }}
    >
      {current.startsWith('zh') ? 'EN' : '中文'}
    </button>
  );
};