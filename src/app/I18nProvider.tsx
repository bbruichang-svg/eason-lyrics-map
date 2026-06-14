'use client';

import { useEffect, useState } from 'react';
import '@/i18n/config';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // i18next 初始化是同步的，但为了安全给 React 一个 tick
    setReady(true);
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}