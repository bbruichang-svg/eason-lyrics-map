'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';
import type { SongPlace, Checkin } from '@/types/database';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, PLACE_TYPE_CONFIG, MARKER_GRAY } from '@/utils/constants';
import { useAuth } from '@/components/AuthProvider';
import PlacePopupContent from './PlacePopupContent';
import MapFilterBar from './MapFilterBar';
import MapHeader from './MapHeader';

// 修正 Leaflet 图标问题（防止 404 请求）
// 所有 Marker 使用自定义 DivIcon，不需要默认图标文件
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png',
});

// 获取自定义标记图标
function getPlaceIcon(type: string, isCheckedIn: boolean): L.DivIcon {
  const config = PLACE_TYPE_CONFIG[type as keyof typeof PLACE_TYPE_CONFIG];
  const color = isCheckedIn ? (config?.color ?? MARKER_GRAY) : MARKER_GRAY;
  const size = isCheckedIn ? 28 : 22;

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: ${isCheckedIn ? '0 0 8px rgba(212,184,134,0.6)' : '0 2px 4px rgba(0,0,0,0.3)'};
      transition: all 0.3s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// 地图事件组件：点击空白处关闭弹窗
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
}

// 飞往用户位置组件
function FlyToUserLocation({ userPosition }: { userPosition: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 10, { duration: 1.5 });
    }
  }, [userPosition, map]);

  return null;
}

export default function LeafletMapComponent() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<SongPlace[]>([]);
  const [checkins, setCheckins] = useState<{ [placeId: string]: Checkin }>({});
  const [checkinCounts, setCheckinCounts] = useState<{ [placeId: string]: number }>({});
  const [filter, setFilter] = useState<{
    search: string;
    placeType: string;
    region: string;
  }>({ search: '', placeType: '', region: '' });
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef<L.Popup | null>(null);

  // 获取用户GPS位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // GPS失败，静默处理
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  // 加载点位数据
  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: placesData } = await supabase
      .from('songs_places')
      .select('*')
      .eq('is_visible', true)
      .order('city_name');

    setPlaces(placesData ?? []);

    // 加载打卡统计
    const { data: countsData } = await supabase
      .from('checkins')
      .select('place_id');

    const counts: { [key: string]: number } = {};
    if (countsData) {
      countsData.forEach((c) => {
        counts[c.place_id] = (counts[c.place_id] || 0) + 1;
      });
    }
    setCheckinCounts(counts);

    // 如果已登录，加载个人打卡记录
    if (user) {
      const { data: userCheckins } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id);

      const checkinMap: { [key: string]: Checkin } = {};
      if (userCheckins) {
        userCheckins.forEach((c) => {
          checkinMap[c.place_id] = c;
        });
      }
      setCheckins(checkinMap);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取所有地区用于筛选
  const regions = [...new Set(places.map((p) => p.country_area))].sort();

  // 筛选点位
  const filteredPlaces = places.filter((place) => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !place.city_name.toLowerCase().includes(q) &&
        !place.song_title.toLowerCase().includes(q) &&
        !place.lyric_text?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filter.placeType && place.place_type !== filter.placeType) return false;
    if (filter.region && place.country_area !== filter.region) return false;
    return true;
  });

  const handlePopupClose = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleCheckinSuccess = useCallback(
    (placeId: string, checkin: Checkin) => {
      setCheckins((prev) => ({ ...prev, [placeId]: checkin }));
      setCheckinCounts((prev) => ({
        ...prev,
        [placeId]: (prev[placeId] || 0) + 1,
      }));
    },
    []
  );

  return (
    <div className="relative w-full h-full">
      <MapHeader userPosition={userPosition} />

      <MapFilterBar
        filter={filter}
        onChange={setFilter}
        regions={regions}
      />

      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handlePopupClose} />
        <FlyToUserLocation userPosition={userPosition} />

        {filteredPlaces.map((place) => {
          const isCheckedIn = !!checkins[place.id];
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={getPlaceIcon(place.place_type, isCheckedIn)}
              eventHandlers={{
                click: () => setSelectedPlace(place.id),
              }}
            >
              <Popup
                className="custom-popup"
                ref={popupRef}
                closeOnClick={false}
                autoClose={false}
                closeOnEscapeKey={true}
              >
                {selectedPlace === place.id ? (
                  <PlacePopupContent
                    place={place}
                    checkin={checkins[place.id] ?? null}
                    checkinCount={checkinCounts[place.id] ?? 0}
                    onCheckinSuccess={handleCheckinSuccess}
                    userPosition={userPosition}
                  />
                ) : (
                  <div className="p-4 min-w-[200px] text-center text-xs text-gray-400">
                    加载中...
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1000]">
          <p className="text-gray-500">加载中...</p>
        </div>
      )}
    </div>
  );
}