'use client';

import Link from 'next/link';
import { Music2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { LanguageSwitcher } from './language-switcher';
import { LOCATIONS } from '@/data/locations';

export default function MapHeader() {
  const { user, signOut } = useAuth();

  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 z-10"
      style={{
        background: 'linear-gradient(180deg, hsl(var(--background)) 60%, transparent)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--gradient-bloom)', boxShadow: 'var(--shadow-bloom)' }}
        >
          <Music2 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-foreground text-lg leading-tight">
            Music Map
          </h1>
          <p className="text-muted-foreground text-[10px] tracking-wide">跟着歌词去旅行</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))', backdropFilter: 'blur(12px)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bloom-pulse" />
          <span className="text-muted-foreground text-[11px] font-medium">{LOCATIONS.length} 个地点</span>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}
            >
              <Music2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground">我的</span>
            </Link>
            <button
              onClick={signOut}
              className="px-2 py-1.5 rounded-full text-xs text-muted-foreground"
              style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}
            >
              退出
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-full text-xs font-medium btn-bloom text-white"
            style={{ background: 'var(--gradient-bloom)' }}
          >
            登录
          </Link>
        )}
      </div>
    </div>
  );
}