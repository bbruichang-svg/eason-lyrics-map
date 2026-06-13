-- ============================================================
-- Eason歌词足迹打卡地图 - Supabase 建表脚本
-- V1.1 修订版
-- 使用方法：在 Supabase SQL Editor 中逐段执行
-- ============================================================

-- 1. 创建枚举类型
CREATE TYPE place_type_enum AS ENUM ('lyric', 'mv', 'concert', 'eason_local');
CREATE TYPE check_type_enum AS ENUM ('real', 'virtual');

-- 2. 地标歌曲主表
CREATE TABLE songs_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name TEXT NOT NULL,
    lat FLOAT8 NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng FLOAT8 NOT NULL CHECK (lng BETWEEN -180 AND 180),
    country_area TEXT NOT NULL,
    address TEXT,
    song_title TEXT NOT NULL,
    album_name TEXT,
    lyric_text TEXT CHECK (length(lyric_text) <= 30),
    place_type place_type_enum NOT NULL,
    place_story TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 用户信息附属表（关联 auth.users）
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    user_bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 用户打卡记录表
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES songs_places(id) ON DELETE CASCADE,
    check_type check_type_enum NOT NULL,
    check_lat FLOAT8,
    check_lng FLOAT8,
    check_photos TEXT[],
    check_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, place_id)
);

-- 5. 打卡图片明细表（V1.1 新增）
CREATE TABLE checkin_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_size INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 点位评论表
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES songs_places(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 创建索引（性能优化）
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_place_id ON checkins(place_id);
CREATE INDEX idx_comments_place_id ON comments(place_id);
CREATE INDEX idx_songs_places_type ON songs_places(place_type);
CREATE INDEX idx_songs_places_visible ON songs_places(is_visible);

-- ============================================================
-- RLS 行级权限策略
-- ============================================================

-- 7.1 songs_places：全员可读，管理员可增删改
ALTER TABLE songs_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "songs_places_select_all" ON songs_places
    FOR SELECT USING (is_visible = true);

CREATE POLICY "songs_places_all_admin" ON songs_places
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- 7.2 profiles：全员可读，仅本人可修改
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_self" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_self" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 7.3 checkins：全员可读（统计用），仅本人可增删改
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_select_all" ON checkins
    FOR SELECT USING (true);

CREATE POLICY "checkins_insert_self" ON checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkins_update_self" ON checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "checkins_delete_self" ON checkins
    FOR DELETE USING (auth.uid() = user_id);

-- 7.4 checkin_photos：全员可读，仅本人可增删
ALTER TABLE checkin_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkin_photos_select_all" ON checkin_photos
    FOR SELECT USING (true);

CREATE POLICY "checkin_photos_insert_self" ON checkin_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM checkins
            WHERE checkins.id = checkin_id
            AND checkins.user_id = auth.uid()
        )
    );

CREATE POLICY "checkin_photos_delete_self" ON checkin_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM checkins
            WHERE checkins.id = checkin_id
            AND checkins.user_id = auth.uid()
        )
    );

-- 7.5 comments：全员可读，登录可新增，仅本人可删除
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_all" ON comments
    FOR SELECT USING (true);

CREATE POLICY "comments_insert_auth" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_self" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- 7.6 自动创建 profile 的触发器（用户注册时自动创建）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nickname)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '歌迷_' || substr(NEW.id::text, 1, 6))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 验证
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;