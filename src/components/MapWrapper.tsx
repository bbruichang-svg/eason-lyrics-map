'use client';

import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="w-12 h-12 rounded-2xl animate-petal-float flex items-center justify-center" style={{ background: 'var(--gradient-bloom)', boxShadow: 'var(--shadow-bloom)' }}>
        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      </div>
      <p className="text-muted-foreground text-sm">地图加载中…</p>
    </div>
  ),
});

export default function MapWrapper() {
  return <LeafletMap />;
}