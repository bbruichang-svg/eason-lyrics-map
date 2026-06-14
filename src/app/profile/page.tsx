'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Trophy, Footprints, Music2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { LOCATIONS } from '@/data/locations';
import { useCheckins } from '@/hooks/useCheckins';
import type { Profile } from '@/types/database';
import LoadingSpinner from '@/components/LoadingSpinner';
import AchievementBadge from '@/components/AchievementBadge';
import BottomNav from '@/components/BottomNav';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false });

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { checkins, hasCheckedIn, loading: checkinsLoading } = useCheckins();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      setProfile(data);
      if (data) { setNickname(data.nickname); setBio(data.user_bio ?? ''); }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const saveProfile = async () => {
    if (!user || !nickname.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ nickname: nickname.trim(), user_bio: bio || null }).eq('user_id', user.id);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, nickname: nickname.trim(), user_bio: bio || null } : prev);
      setEditing(false);
    }
    setSaving(false);
  };

  if (authLoading || loading || checkinsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) return null;

  const checkedLocations = LOCATIONS.filter((l) => hasCheckedIn(l.id));
  const total = LOCATIONS.length;
  const progress = checkedLocations.length / total;

  const stats = {
    total: checkins.length,
    countries: [...new Set(checkedLocations.map((l) => l.country))].length,
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid hsl(var(--border)/0.6)' }}>
        <h1 className="font-display font-semibold text-xl text-foreground flex items-center gap-2">
          <Footprints className="w-5 h-5 text-primary" />
          我的足迹
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Profile Card */}
          <div className="rounded-3xl p-4" style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground">{nickname?.[0] ?? '🎵'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-2">
                    <input value={nickname} onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-sm bg-background text-foreground border border-border focus:outline-none focus:border-primary"
                      placeholder="昵称" maxLength={20} />
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-background text-foreground border border-border focus:outline-none focus:border-primary resize-none"
                      placeholder="个人简介" rows={2} maxLength={100} />
                    <div className="flex gap-2">
                      <button onClick={saveProfile} disabled={saving || !nickname.trim()}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button onClick={() => { setEditing(false); setNickname(profile?.nickname ?? ''); setBio(profile?.user_bio ?? ''); }}
                        className="px-3 py-1 rounded-lg text-xs text-muted-foreground border border-border hover:text-foreground transition-colors">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-sm text-foreground">{profile?.nickname ?? '歌迷'}</h2>
                      <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                    {profile?.user_bio && <p className="text-xs text-muted-foreground mt-1">{profile.user_bio}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Hero Card */}
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--gradient-hero)', border: '1px solid hsl(var(--glass-border))' }}>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">旅行进度</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display font-bold text-4xl text-foreground">{checkedLocations.length}</span>
                    <span className="text-muted-foreground text-lg">/{total}</span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">个音乐地标已探访</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--gradient-bloom)', boxShadow: 'var(--shadow-bloom)' }}>
                  <Trophy className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress * 100}%`, background: 'var(--gradient-bloom)' }} />
                </div>
                <p className="text-muted-foreground text-xs mt-1.5">
                  {Math.round(progress * 100)}% · 还有 {total - checkedLocations.length} 个地点等你探索
                </p>
              </div>

              {checkedLocations.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'hsl(var(--primary)/0.15)', border: '1px solid hsl(var(--primary)/0.25)' }}>
                  <Music2 className="w-3 h-3 text-primary" />
                  <span className="text-primary text-xs font-medium">
                    解锁了 {[...new Set(checkedLocations.flatMap(l => l.songs.map(s => s.id)))].length} 首歌曲
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mini Map */}
          <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid hsl(var(--glass-border))' }}>
            <div className="px-4 pt-4 pb-2 flex items-center gap-2" style={{ background: 'hsl(var(--card))' }}>
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-foreground font-semibold text-sm">足迹地图</h2>
            </div>
            <div className="h-44">
              <MiniMap />
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="space-y-3">
            <h2 className="text-foreground font-semibold text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              成就徽章
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {LOCATIONS.map((loc) => (
                <AchievementBadge key={loc.id} location={loc} unlocked={hasCheckedIn(loc.id)} size="sm" />
              ))}
            </div>
          </div>

          {/* Checkin History */}
          {checkins.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-foreground font-semibold text-sm flex items-center gap-2">
                <Footprints className="w-4 h-4 text-primary" />
                打卡记录 ({checkins.length})
              </h2>
              <div className="space-y-2">
                {[...checkins].reverse().map((checkin) => {
                  const loc = LOCATIONS.find((l) => l.id === checkin.locationId);
                  if (!loc) return null;
                  return (
                    <button
                      key={checkin.id}
                      onClick={() => router.push(`/place/${loc.id}`)}
                      className="w-full flex gap-3 rounded-2xl p-3.5 text-left transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}
                    >
                      <img src={loc.cover} alt={loc.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold text-sm">{loc.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Music2 className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                          <p className="text-muted-foreground text-xs truncate">《{loc.songs[0]?.name}》</p>
                        </div>
                        {checkin.content && <p className="text-muted-foreground text-xs mt-1 truncate">{checkin.content}</p>}
                        <p className="text-muted-foreground text-[10px] mt-1">{new Date(checkin.createdAt).toLocaleDateString('zh-CN')}</p>
                      </div>
                      {checkin.photos[0] && <img src={checkin.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--gradient-bloom)', boxShadow: 'var(--shadow-bloom)', opacity: 0.6 }}>
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-display font-medium text-lg">旅程还未开始</p>
                <p className="text-muted-foreground text-sm mt-1">去地图上探索你的第一个音乐地标吧</p>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <BottomNav />
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