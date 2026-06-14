'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Location } from '@/data/locations';

interface AchievementBadgeProps {
  location: Location;
  unlocked: boolean;
  size?: 'sm' | 'md';
}

export default function AchievementBadge({ location, unlocked, size = 'md' }: AchievementBadgeProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5 transition-all duration-300', !unlocked && 'opacity-35')}>
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden border-2 transition-all duration-300',
          size === 'sm' ? 'w-12 h-12' : 'w-16 h-16',
          unlocked ? 'border-primary/70' : 'border-border'
        )}
        style={unlocked ? { boxShadow: 'var(--shadow-glow-pink)' } : undefined}
      >
        <img src={location.cover} alt={location.name} className="w-full h-full object-cover" />
        {!unlocked && <div className="absolute inset-0 bg-background/50" />}
        {unlocked && (
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-checked flex items-center justify-center">
            <CheckCircle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span
        className={cn(
          'font-medium text-center leading-tight',
          size === 'sm' ? 'text-[10px] max-w-[48px]' : 'text-xs max-w-[64px]',
          unlocked ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {location.name}
      </span>
    </div>
  );
}