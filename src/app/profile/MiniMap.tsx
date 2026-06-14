'use client';

import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { LOCATIONS } from '@/data/locations';
import { useCheckins } from '@/hooks/useCheckins';
import 'leaflet/dist/leaflet.css';

export default function MiniMap() {
  const { hasCheckedIn } = useCheckins();

  return (
    <MapContainer
      center={[25, 110]}
      zoom={2}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      {LOCATIONS.map((loc) => (
        <CircleMarker
          key={loc.id}
          center={[loc.lat, loc.lng]}
          radius={hasCheckedIn(loc.id) ? 6 : 3}
          pathOptions={{
            fillColor: hasCheckedIn(loc.id) ? '#D45E8A' : '#8B5FBF',
            color: 'transparent',
            fillOpacity: hasCheckedIn(loc.id) ? 0.9 : 0.35,
          }}
        />
      ))}
    </MapContainer>
  );
}