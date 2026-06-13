// 全局常量

export const SITE_NAME = 'Eason歌词足迹打卡地图';
export const SITE_DESCRIPTION = '陈奕迅歌迷专属全球歌词地标互动地图';

// 地图配置
export const DEFAULT_MAP_CENTER: [number, number] = [25, 0]; // 全球视角
export const DEFAULT_MAP_ZOOM = 2;
export const GPS_RADIUS_LIMIT = 500; // 实地打卡距离限制（米）

// 图片限制
export const MAX_PHOTOS_PER_CHECKIN = 4;
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_PHOTOS_PER_USER = 50;

// 评论分页
export const COMMENTS_PAGE_SIZE = 20;

// 点位类型元数据
export const PLACE_TYPE_CONFIG = {
  lyric: {
    label: '歌词地标',
    color: '#3b82f6',      // 蓝
    markerColor: 'blue',
  },
  mv: {
    label: 'MV取景地',
    color: '#ec4899',      // 粉
    markerColor: 'pink',
  },
  concert: {
    label: '演唱会地标',
    color: '#ef4444',      // 红
    markerColor: 'red',
  },
  eason_local: {
    label: '艺人专属地标',
    color: '#d4b886',      // 镏金
    markerColor: 'gold',
  },
} as const;

// 图标颜色
export const MARKER_COLORS = {
  lyric: '#3b82f6',
  mv: '#ec4899',
  concert: '#ef4444',
  eason_local: '#d4b886',
} as const;

export const MARKER_GRAY = '#999999';