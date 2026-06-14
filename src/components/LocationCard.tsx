'use client';

import { useRouter } from 'next/navigation';
import { Music, MapPin, Users, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Location } from '@/data/locations';

interface LocationCardProps {
  location: Location;
  checked: boolean;
  checkinCount: number;
  onClose: () => void;
  onCheckin: () => void;
}

export default function LocationCard({ location, checked, checkinCount, onClose, onCheckin }: LocationCardProps) {
  const navigate = useRouter();

  return (
    <div className="animate-card-slide-up bg-card/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-5 shadow-card">
      <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'hsl(var(--border))' }} />

      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-card">
          <img src={location.cover} alt={location.name} className="w-full h-full object-cover" />
          {checked && (
            <div className="absolute inset-0 bg-checked/40 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-lg text-foreground leading-tight truncate">
                {location.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-xs truncate">{location.city} · {location.country}</span>
              </div>
            </div>
            {checked ? (
              <span className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-checked/15 text-checked border border-checked/20">
                已打卡
              </span>
            ) : location.isHot ? (
              <span className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                热门
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 space-y-1.5">
            {location.songs.slice(0, 2).map((song) => (
              <div key={song.id} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Music className="w-2.5 h-2.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-foreground text-sm font-medium truncate block">《{song.name}》</span>
                  {song.lyric && (
                    <span className="text-muted-foreground text-[10px] italic truncate block leading-relaxed mt-0.5">
                      &ldquo;{song.lyric}&rdquo;
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs flex-shrink-0 mt-0.5">{song.year}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{checkinCount.toLocaleString()} 人到访</span>
          </div>
          {location.tour && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="text-primary text-[10px] font-medium">FEAR AND DREAMS 巡演</span>
              </div>
              <p className="text-muted-foreground text-[10px] mt-0.5">
                {location.tour.venue} · {location.tour.shows}场 · {location.tour.period}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-full border border-white/12 text-muted-foreground text-sm font-medium hover:text-foreground hover:border-white/20 transition-all"
        >
          关闭
        </button>
        <button
          onClick={() => navigate.push(`/place/${location.id}`)}
          className="flex-1 py-2.5 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-1.5 btn-bloom"
          style={{ background: 'var(--gradient-bloom)' }}
        >
          查看详情 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}