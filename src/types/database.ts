// 数据库类型定义（与 Supabase 表结构一一对应）

export type PlaceType = 'lyric' | 'mv' | 'concert' | 'eason_local';
export type CheckType = 'real' | 'virtual';

export interface SongPlace {
  id: string;
  city_name: string;
  lat: number;
  lng: number;
  country_area: string;
  address: string | null;
  song_title: string;
  album_name: string | null;
  lyric_text: string | null;
  place_type: PlaceType;
  place_story: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface Profile {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  user_bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  place_id: string;
  check_type: CheckType;
  check_lat: number | null;
  check_lng: number | null;
  check_photos: string[] | null;
  check_note: string | null;
  created_at: string;
}

export interface CheckinPhoto {
  id: string;
  checkin_id: string;
  photo_url: string;
  photo_size: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  place_id: string;
  user_id: string;
  comment_content: string;
  created_at: string;
}

// 联合查询类型
export interface CheckinWithPlace extends Checkin {
  songs_places: Pick<SongPlace, 'city_name' | 'song_title' | 'place_type'>;
}

export interface CommentWithProfile extends Comment {
  profiles: Pick<Profile, 'nickname' | 'avatar_url'>;
}