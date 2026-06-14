'use client';

import { Search } from 'lucide-react';
import { PLACE_TYPE_CONFIG } from '@/utils/constants';

interface FilterState {
  search: string;
  placeType: string;
  region: string;
}

interface MapFilterBarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  regions: string[];
}

export default function MapFilterBar({ filter, onChange, regions }: MapFilterBarProps) {
  return (
    <div className="absolute top-16 left-0 right-0 z-[1000] p-3 pointer-events-none">
      <div className="max-w-lg mx-auto flex flex-col gap-2 pointer-events-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="搜索城市、歌曲、歌词..."
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none transition-colors"
            style={{ background: 'hsl(var(--card) / 0.95)', border: '1px solid hsl(var(--glass-border))', color: 'hsl(var(--foreground))' }}
          />
        </div>

        {/* Filter tags */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onChange({ ...filter, placeType: '' })}
            className={`petal-tag shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filter.placeType ? 'selected' : ''}`}
          >
            全部
          </button>

          {Object.entries(PLACE_TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => onChange({ ...filter, placeType: filter.placeType === key ? '' : key })}
              className={`petal-tag shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter.placeType === key ? 'selected' : ''}`}
            >
              {config.label}
            </button>
          ))}

          <select
            value={filter.region}
            onChange={(e) => onChange({ ...filter, region: e.target.value })}
            className="petal-tag shrink-0 px-3 py-1 rounded-full text-xs cursor-pointer"
          >
            <option value="">全部地区</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}