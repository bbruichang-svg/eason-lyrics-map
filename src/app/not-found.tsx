import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-sm text-gray-500 mb-6">
          这个地标可能消失了，或者地址不正确
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#333] transition-colors"
        >
          返回地图
        </Link>
      </div>
    </div>
  );
}