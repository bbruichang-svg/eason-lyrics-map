'use client';

import dynamic from 'next/dynamic';

// 动态导入 LeafletMap，禁用 SSR（Leaflet 需要浏览器 API）
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <p className="text-gray-500 text-sm">地图加载中...</p>
    </div>
  ),
});

export default function MapWrapper() {
  return <LeafletMap />;
}