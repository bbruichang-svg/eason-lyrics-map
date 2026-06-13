'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SongPlace, Checkin } from '@/types/database';
import { PLACE_TYPE_CONFIG, GPS_RADIUS_LIMIT } from '@/utils/constants';
import { useAuth } from '@/components/AuthProvider';
import CheckinModal from './CheckinModal';

interface PlacePopupContentProps {
  place: SongPlace;
  checkin: Checkin | null;
  checkinCount: number;
  onCheckinSuccess: (placeId: string, checkin: Checkin) => void;
  userPosition: [number, number] | null;
}

export default function PlacePopupContent({
  place,
  checkin,
  checkinCount,
  onCheckinSuccess,
  userPosition,
}: PlacePopupContentProps) {
  const { user } = useAuth();
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  const typeConfig = PLACE_TYPE_CONFIG[place.place_type];

  // 计算与地标的距离
  const getDistance = (): number | null => {
    if (!userPosition) return null;
    const R = 6371000; // 地球半径（米）
    const dLat = ((place.lat - userPosition[0]) * Math.PI) / 180;
    const dLng = ((place.lng - userPosition[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userPosition[0] * Math.PI) / 180) *
        Math.cos((place.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = getDistance();
  const canRealCheckin = distance !== null && distance <= GPS_RADIUS_LIMIT;

  const handleCheckin = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setShowCheckinModal(true);
  };

  return (
    <div className="p-4 min-w-[240px] max-w-[300px]">
      {/* 顶部：地标名 + 类型标签 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-900 truncate">
          {place.city_name}
        </h3>
        <span
          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium text-white"
          style={{ backgroundColor: typeConfig.color }}
        >
          {typeConfig.label}
        </span>
      </div>

      {/* 歌词 */}
      {place.lyric_text && (
        <p className="text-xs text-gray-500 italic mb-2 leading-relaxed">
          &ldquo;{place.lyric_text}&rdquo;
        </p>
      )}

      {/* 歌曲信息 */}
      <p className="text-xs text-gray-600 mb-1">
        <span className="font-medium">{place.song_title}</span>
        {place.album_name && <span className="text-gray-400"> · {place.album_name}</span>}
      </p>

      {/* 地区 */}
      <p className="text-xs text-gray-400 mb-2">
        {place.country_area}
        {place.address && ` · ${place.address}`}
      </p>

      {/* 故事 */}
      {place.place_story && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {place.place_story}
        </p>
      )}

      {/* 打卡人数 */}
      <div className="flex items-center gap-1 mb-3">
        <span className="text-[10px] text-gray-400">
          🏷️ {checkinCount} 人已打卡
        </span>
        {checkin && (
          <span className="text-[10px] text-gray-400">
            · {checkin.check_type === 'real' ? '📍实地' : '☁️云打卡'}
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {checkin ? (
          <button
            disabled
            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            已点亮 ✓
          </button>
        ) : (
          <button
            onClick={handleCheckin}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: typeConfig.color }}
          >
            ✨ 点亮足迹
          </button>
        )}

        <Link
          href={`/place/${place.id}`}
          className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          评论
        </Link>
      </div>

      {/* 距离提示 */}
      {!checkin && distance !== null && (
        <p className="mt-2 text-[10px] text-gray-400">
          {canRealCheckin
            ? '📍 你在地标附近，可实地打卡'
            : `距地标约 ${Math.round(distance)}m · 超过500m无法实地打卡`}
        </p>
      )}

      {/* 打卡弹窗 */}
      {showCheckinModal && (
        <CheckinModal
          place={place}
          canRealCheckin={canRealCheckin}
          onClose={() => setShowCheckinModal(false)}
          onSuccess={(checkin) => {
            onCheckinSuccess(place.id, checkin);
            setShowCheckinModal(false);
          }}
        />
      )}
    </div>
  );
}