'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { FiMapPin, FiUser, FiLogOut } from 'react-icons/fi';

interface MapHeaderProps {
  userPosition: [number, number] | null;
}

export default function MapHeader({ userPosition }: MapHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="absolute top-0 right-0 z-[1000] p-3 flex items-center gap-2">
      {/* 用户信息 & 登录入口 */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs text-gray-700 hover:bg-white transition-colors"
            >
              <FiUser size={14} />
              <span>我的足迹</span>
            </Link>
            <button
              onClick={signOut}
              className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-gray-500 hover:text-gray-700 hover:bg-white transition-colors"
              title="退出登录"
            >
              <FiLogOut size={14} />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs text-gray-700 hover:bg-white transition-colors"
          >
            登录
          </Link>
        )}
      </div>
    </div>
  );
}