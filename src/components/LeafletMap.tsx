'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';
import type { SongPlace, Checkin } from '@/types/database';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/constants';
import { useAuth } from '@/components/AuthProvider';
import MapFilterBar from './MapFilterBar';
import MapHeader from './MapHeader';
import LocationCard from './LocationCard';
import BottomNav from './BottomNav';
import { LOCATIONS, getLocationById } from '@/data/locations';
import CheckinModal from './CheckinModal';

delete (L.Icon.Default.prototype as any)._getIconUrl;

function createCustomIcon(status: 'unchecked' | 'checked' | 'hot', selected: boolean): L.DivIcon {
  const configs = {
    unchecked: { fill: '#8B5FBF', glow: '#8B5FBF', opacity: '0.8' },
    checked:   { fill: '#4ade80', glow: '#4ade80', opacity: '0.9' },
    hot:       { fill: '#D45E8A', glow: '#D45E8A', opacity: '1' },
  };
  const c = configs[status];
  const size = selected ? 44 : status === 'hot' ? 36 : 30;
  const pulse = status === 'hot' || selected;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
      ${pulse ? `<circle cx="20" cy="20" r="18" fill="${c.glow}" opacity="0.15"/>` : ''}
      <circle cx="20" cy="20" r="13" fill="${c.fill}" opacity="0.22"/>
      <circle cx="20" cy="20" r="8" fill="${c.fill}" opacity="${c.opacity}"/>
      <circle cx="20" cy="20" r="3.5" fill="white" opacity="0.95"/>
      ${selected ? `<circle cx="20" cy="20" r="8" fill="none" stroke="${c.glow}" stroke-width="2" opacity="0.7"/>` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: () => onMapClick() });
  return null;
}

/** Map marker as displayed on the map */
interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  isHot?: boolean;
}

/** Build markers from both static locations data and Supabase DB places */
function buildMarkers(locations: typeof LOCATIONS, dbPlaces: SongPlace[]): MapMarker[] {
  // Start with all static locations
  const markers = new Map<string, MapMarker>();
  for (const loc of locations) {
    markers.set(loc.id, {
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      country: loc.country,
      city: loc.city,
      isHot: loc.isHot,
    });
  }
  // Add any DB-only places (using UUIDs from Supabase)
  for (const p of dbPlaces) {
    if (!markers.has(p.id)) {
      markers.set(p.id, {
        id: p.id,
        name: p.city_name,
        lat: p.lat,
        lng: p.lng,
        country: p.country_area,
        city: p.city_name,
      });
    }
  }
  return Array.from(markers.values());
}

export default function LeafletMap() {
  const { user } = useAuth();
  const [dbPlaces, setDbPlaces] = useState<SongPlace[]>([]);
  const [checkinMap, setCheckinMap] = useState<Record<string, Checkin>>({});
  const [checkinCounts, setCheckinCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState({ search: '', placeType: '', region: '' });
  const [selectedPlace, setSelectedPlace] = useState<SongPlace | null>(null);
  const [selectedStatic, setSelectedStatic] = useState<typeof LOCATIONS[0] | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase (non-blocking — fallback to static data)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: placesData } = await supabase
        .from('songs_places')
        .select('*')
        .eq('is_visible', true)
        .order('city_name');
      if (placesData) setDbPlaces(placesData);

      const { data: countsData } = await supabase.from('checkins').select('place_id');
      const counts: Record<string, number> = {};
      if (countsData) {
        countsData.forEach((c) => { counts[c.place_id] = (counts[c.place_id] || 0) + 1; });
      }
      setCheckinCounts(counts);

      if (user) {
        const { data: userCheckins } = await supabase
          .from('checkins')
          .select('*')
          .eq('user_id', user.id);
        const cmap: Record<string, Checkin> = {};
        if (userCheckins) userCheckins.forEach((c) => { cmap[c.place_id] = c; });
        setCheckinMap(cmap);
      }
    } catch {
      // Supabase not configured — still fine, static data works
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build combined markers
  const markers = buildMarkers(LOCATIONS, dbPlaces);

  // Available regions for filter (from static data + DB)
  const regions = [...new Set([...LOCATIONS.map(l => l.country), ...dbPlaces.map(p => p.country_area)])].sort();

  // Filter
  const filteredMarkers = markers.filter((m) => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const loc = getLocationById(m.id);
      const songMatch = loc?.songs.some(s => s.name.toLowerCase().includes(q) || (s.lyric && s.lyric.toLowerCase().includes(q)));
      if (!m.name.toLowerCase().includes(q) && !m.city.toLowerCase().includes(q) && !songMatch) return false;
    }
    if (filter.region && m.country !== filter.region) return false;
    return true;
  });

  const handleMarkerClick = useCallback((m: MapMarker) => {
    // Try to match with static location data first
    const loc = getLocationById(m.id);
    setSelectedStatic(loc ?? null);
    // Also find in DB places
    const dbPlace = dbPlaces.find(p => p.id === m.id) ?? null;
    setSelectedPlace(dbPlace);
  }, [dbPlaces]);

  const handleMapClick = useCallback(() => {
    setSelectedPlace(null);
    setSelectedStatic(null);
  }, []);

  const handleCheckinSuccess = useCallback((placeId: string, checkin: Checkin) => {
    setCheckinMap((prev) => ({ ...prev, [placeId]: checkin }));
    setCheckinCounts((prev) => ({ ...prev, [placeId]: (prev[placeId] || 0) + 1 }));
  }, []);

  const handleOpenCheckin = useCallback(() => {
    if (!user) { window.location.href = '/login'; return; }
    setShowCheckinModal(true);
  }, [user]);

  const displayId = selectedPlace?.id ?? selectedStatic?.id ?? '';
  const displayLoc = selectedStatic;
  const checked = displayId ? !!checkinMap[displayId] : false;

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <MapHeader />

        <MapFilterBar filter={filter} onChange={setFilter} regions={regions} />

        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          className="w-full h-full"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />

          {filteredMarkers.map((m) => {
            const isCheckedIn = !!checkinMap[m.id];
            const isHot = m.isHot ?? false;
            const status = isCheckedIn ? 'checked' : isHot ? 'hot' : 'unchecked' as const;
            const isSelected = selectedStatic?.id === m.id;

            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={createCustomIcon(status, isSelected)}
                eventHandlers={{ click: () => handleMarkerClick(m) }}
              >
                {isSelected && (
                  <Popup className="custom-popup" closeOnClick={false} autoClose={false} closeOnEscapeKey={true}>
                    <div className="p-3 min-w-[200px] text-center space-y-1">
                      <p className="text-foreground font-semibold text-sm">{m.name}</p>
                      {displayLoc?.songs[0] && (
                        <p className="text-muted-foreground text-xs">《{displayLoc.songs[0].name}》</p>
                      )}
                      {displayLoc?.songs[0]?.lyric && (
                        <p className="text-muted-foreground text-[10px] italic leading-relaxed">
                          &ldquo;{displayLoc.songs[0].lyric}&rdquo;
                        </p>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div
          className="absolute bottom-4 left-4 rounded-2xl px-3 py-2.5 flex flex-col gap-2 z-[400]"
          style={{ background: 'hsl(var(--card) / 0.92)', backdropFilter: 'blur(16px)', border: '1px solid hsl(var(--glass-border))' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5FBF' }} />
            <span className="text-muted-foreground text-[10px]">未打卡</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-checked" />
            <span className="text-muted-foreground text-[10px]">已打卡</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground text-[10px]">热门</span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[1000]">
            <div className="w-12 h-12 rounded-2xl animate-petal-float flex items-center justify-center" style={{ background: 'var(--gradient-bloom)', boxShadow: 'var(--shadow-bloom)' }}>
              <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Location Card Overlay */}
      {displayLoc && (
        <div className="flex-shrink-0 z-[500]">
          <LocationCard
            location={displayLoc}
            checked={checked}
            checkinCount={checkinCounts[displayLoc.id] ?? displayLoc.checkinCount}
            onClose={() => { setSelectedPlace(null); setSelectedStatic(null); }}
            onCheckin={handleOpenCheckin}
          />
        </div>
      )}

      {/* Checkin Modal */}
      {showCheckinModal && selectedPlace && (
        <CheckinModal
          place={selectedPlace}
          canRealCheckin={false}
          onClose={() => setShowCheckinModal(false)}
          onSuccess={(checkin) => {
            handleCheckinSuccess(selectedPlace.id, checkin);
            setShowCheckinModal(false);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}