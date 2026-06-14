'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Map, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const isMap = pathname === '/';
  const isProfile = pathname === '/profile';

  if (pathname === '/login') return null;

  return (
    <div
      className="bottom-nav-safe flex-shrink-0 border-t flex relative z-[600]"
      style={{ background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(20px)', borderColor: 'hsl(var(--border))' }}
    >
      <button
        onClick={() => router.push('/')}
        className={cn(
          'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all duration-200 relative',
          isMap ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Map className={cn('w-5 h-5 transition-transform duration-200', isMap && 'scale-110')} />
        <span className={cn('font-medium', isMap && 'font-semibold')}>音乐地图</span>
        {isMap && <div className="absolute bottom-0 w-10 h-0.5 bg-primary rounded-full" />}
      </button>
      <button
        onClick={() => router.push('/profile')}
        className={cn(
          'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all duration-200 relative',
          isProfile ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Footprints className={cn('w-5 h-5 transition-transform duration-200', isProfile && 'scale-110')} />
        <span className={cn('font-medium', isProfile && 'font-semibold')}>我的足迹</span>
        {isProfile && <div className="absolute bottom-0 w-10 h-0.5 bg-primary rounded-full" />}
      </button>
    </div>
  );
}