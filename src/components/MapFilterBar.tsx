'use client';

import { FiSearch } from 'react-icons/fi';
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
    <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none">
      <div className="max-w-lg mx-auto flex flex-col gap-2 pointer-events-auto">
        {/* 搜索框 */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="搜索城市、歌曲、歌词..."
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm text-sm text-gray-700 placeholder-gray-400 border border-transparent focus:border-[#d4b886] focus:outline-none transition-colors"
          />
        </div>

        {/* 筛选行 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* 全部 */}
          <button
            onClick={() => onChange({ ...filter, placeType: '' })}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !filter.placeType
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white'
            }`}
          >
            全部
          </button>

          {/* 分类筛选 */}
          {Object.entries(PLACE_TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() =>
                onChange({
                  ...filter,
                  placeType: filter.placeType === key ? '' : key,
                })
              }
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter.placeType === key
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white'
              }`}
              style={
                filter.placeType === key
                  ? { backgroundColor: config.color }
                  : {}
              }
            >
              {config.label}
            </button>
          ))}

          {/* 地区筛选 */}
          <select
            value={filter.region}
            onChange={(e) => onChange({ ...filter, region: e.target.value })}
            className="shrink-0 px-3 py-1 rounded-full text-xs bg-white/90 backdrop-blur-sm text-gray-600 border-0 cursor-pointer hover:bg-white transition-colors"
          >
            <option value="">全部地区</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}