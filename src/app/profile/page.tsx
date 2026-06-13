'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { CheckinWithPlace, Profile } from '@/types/database';
import { PLACE_TYPE_CONFIG } from '@/utils/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FiArrowLeft, FiMapPin, FiCamera, FiEdit2, FiCheck } from 'react-icons/fi';

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<CheckinWithPlace[]>([]);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map'>('timeline');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);

      // 加载个人资料
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      if (profileData) {
        setNickname(profileData.nickname);
        setBio(profileData.user_bio ?? '');
      }

      // 加载打卡记录（含地点信息）
      const { data: checkinData } = await supabase
        .from('checkins')
        .select(`
          *,
          songs_places:place_id (
            city_name,
            song_title,
            place_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setCheckins((checkinData ?? []) as unknown as CheckinWithPlace[]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  // 保存资料
  const saveProfile = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ nickname: nickname.trim(), user_bio: bio || null })
      .eq('user_id', user.id);

    if (!error) {
      setProfile((prev) =>
        prev
          ? { ...prev, nickname: nickname.trim(), user_bio: bio || null }
          : prev
      );
      setEditing(false);
    }
    setSaving(false);
  };

  // 统计
  const stats = {
    total: checkins.length,
    real: checkins.filter((c) => c.check_type === 'real').length,
    virtual: checkins.filter((c) => c.check_type === 'virtual').length,
    countries: [...new Set(checkins.map((c) => c.songs_places?.city_name))].length,
  };

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen message="加载中..." />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold text-gray-900">我的足迹</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 个人资料卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            {/* 头像 */}
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">{nickname?.[0] ?? '🎵'}</span>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-[#d4b886] focus:outline-none"
                    placeholder="昵称"
                    maxLength={20}
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-[#d4b886] focus:outline-none resize-none"
                    placeholder="个人简介"
                    rows={2}
                    maxLength={100}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving || !nickname.trim()}
                      className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-50 transition-colors"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setNickname(profile?.nickname ?? '');
                        setBio(profile?.user_bio ?? '');
                      }}
                      className="px-3 py-1 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-gray-900">
                      {profile?.nickname ?? '歌迷'}
                    </h2>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiEdit2 size={14} />
                    </button>
                  </div>
                  {profile?.user_bio && (
                    <p className="text-xs text-gray-500 mt-1">{profile.user_bio}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-[10px] text-gray-500">总打卡</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.real}</p>
              <p className="text-[10px] text-gray-500">实地</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-500">{stats.virtual}</p>
              <p className="text-[10px] text-gray-500">云打卡</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.countries}</p>
              <p className="text-[10px] text-gray-500">城市</p>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            打卡时间线
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            个人地图
          </button>
        </div>

        {/* 时间线 */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {checkins.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-sm text-gray-400">还没有点亮过足迹</p>
                <Link
                  href="/"
                  className="inline-block mt-3 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#1a1a1a] hover:bg-[#333] transition-colors"
                >
                  去地图看看
                </Link>
              </div>
            ) : (
              checkins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="bg-white rounded-xl shadow-sm p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {checkin.songs_places?.city_name ?? '未知地点'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {checkin.songs_places?.song_title ?? '未知歌曲'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${
                        checkin.check_type === 'real'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-blue-50 text-blue-500'
                      }`}
                    >
                      {checkin.check_type === 'real' ? '📍实地' : '☁️云打卡'}
                    </span>
                  </div>

                  {checkin.check_note && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {checkin.check_note}
                    </p>
                  )}

                  {checkin.check_photos && checkin.check_photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {checkin.check_photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Checkin photo ${i + 1}`}
                          className="w-20 h-20 rounded-lg object-cover shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400">
                    {new Date(checkin.created_at).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 个人地图 */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            {checkins.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">暂无足迹数据</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  已点亮 {stats.countries} 个城市
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* 地区汇总 - 简单卡片式展示 */}
                  {Object.entries(
                    checkins.reduce<Record<string, number>>((acc, c) => {
                      const city = c.songs_places?.city_name ?? '未知';
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([city, count]) => (
                    <div
                      key={city}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50"
                    >
                      <FiMapPin size={14} className="text-[#d4b886]" />
                      <span className="text-xs text-gray-700">{city}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        ×{count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          歌词版权归属所属唱片公司，本网站仅歌迷非公益情怀使用
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}