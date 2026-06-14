'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="text-5xl mb-2">🗺️</div>
        <h1 className="font-display font-semibold text-foreground text-xl">页面未找到</h1>
        <p className="text-muted-foreground text-sm">
          这个地标可能消失了，或者地址不正确
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full text-white font-semibold btn-bloom"
          style={{ background: 'var(--gradient-bloom)' }}
        >
          返回地图
        </Link>
      </div>
    </div>
  );
}