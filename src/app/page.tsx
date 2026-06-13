'use client';

import { AuthProvider } from '@/components/AuthProvider';
import MapWrapper from '@/components/MapWrapper';

export default function HomePage() {
  return (
    <AuthProvider>
      <main className="h-screen w-screen overflow-hidden">
        {/* 标题栏 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <h1 className="text-sm font-semibold text-white drop-shadow-lg bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full pointer-events-auto text-center">
            🎵 Eason歌词足迹地图
          </h1>
        </div>

        <MapWrapper />
      </main>
    </AuthProvider>
  );
}