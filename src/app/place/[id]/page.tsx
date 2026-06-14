'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Music, MapPin, Users, Navigation, CheckCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { getLocationById } from '@/data/locations';
import { useCheckins } from '@/hooks/useCheckins';
import type { SongPlace, Comment, Profile } from '@/types/database';
import { COMMENTS_PAGE_SIZE } from '@/utils/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FiSend, FiTrash2 } from 'react-icons/fi';

interface CommentWithProfile extends Comment {
  profiles: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

function PlaceDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { hasCheckedIn, getCheckinsByLocation } = useCheckins();

  const [place, setPlace] = useState<SongPlace | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [checkinCount, setCheckinCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const location = getLocationById(id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: placeData } = await supabase
        .from('songs_places')
        .select('*')
        .eq('id', id)
        .single();
      setPlace(placeData);

      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', id);
      setCheckinCount(count ?? 0);

      loadComments(0);
      setLoading(false);
    };
    load();
  }, [id]);

  const loadComments = async (pageNum: number) => {
    const from = pageNum * COMMENTS_PAGE_SIZE;
    const to = from + COMMENTS_PAGE_SIZE - 1;
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id (nickname, avatar_url)')
      .eq('place_id', id)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (data) {
      const typed = data as unknown as CommentWithProfile[];
      if (pageNum === 0) setComments(typed);
      else setComments((prev) => [...prev, ...typed]);
      setHasMore(typed.length === COMMENTS_PAGE_SIZE);
      setPage(pageNum);
    }
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ place_id: id, user_id: user.id, comment_content: newComment.trim() })
      .select('*, profiles:user_id (nickname, avatar_url)')
      .single();
    if (!error && data) {
      setComments((prev) => [data as unknown as CommentWithProfile, ...prev]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleNavigate = () => {
    if (!place) return;
    window.open(
      `https://uri.amap.com/marker?position=${place.lng},${place.lat}&name=${encodeURIComponent(place.city_name)}&src=musicmap`,
      '_blank'
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const checked = hasCheckedIn(id);
  const myCheckins = getCheckinsByLocation(id);
  const totalCount = checkinCount + myCheckins.length;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Hero */}
      <div className="relative flex-shrink-0 h-60">
        {location?.cover ? (
          <img src={location.cover} alt={place?.city_name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'var(--gradient-hero)' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsl(var(--background)/0.3) 0%, hsl(var(--background)/0.95) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, hsl(var(--accent)/0.08) 100%)' }} />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'hsl(var(--background)/0.7)', backdropFilter: 'blur(12px)', border: '1px solid hsl(var(--glass-border))' }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>

        {checked && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
            style={{ background: 'hsl(var(--checked)/0.85)', backdropFilter: 'blur(8px)' }}>
            <CheckCircle className="w-3.5 h-3.5" />
            已打卡
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="font-display font-bold text-foreground text-2xl leading-tight">{place?.city_name ?? '未知地点'}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">{place?.country_area ?? ''}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Songs Card */}
          {location && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))', backdropFilter: 'blur(20px)' }}>
              <h2 className="text-foreground font-semibold text-sm flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--gradient-bloom)' }}>
                  <Music className="w-3 h-3 text-white" />
                </div>
                关联歌曲
              </h2>
              <div className="space-y-3">
                {location.songs.map((song) => (
                  <div key={song.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.2)' }}>
                      <Music className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-sm">《{song.name}》</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {song.artist}{song.album ? ` · ${song.album}` : ''} · {song.year}年
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-primary" style={{ background: 'hsl(var(--primary)/0.12)' }}>
                      {song.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story */}
          <div className="space-y-2">
            <h2 className="text-foreground font-semibold text-sm">地点故事</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{place?.place_story ?? location?.description ?? '暂无描述'}</p>
            {/* Lyric excerpt card */}
            {location && location.songs.map((s) => s.lyric).filter(Boolean).length > 0 && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: 'hsl(var(--primary)/0.08)', border: '1px solid hsl(var(--primary)/0.18)', backdropFilter: 'blur(20px)' }}>
                <h2 className="text-foreground font-semibold text-sm flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  歌词摘录
                </h2>
                <div className="space-y-3">
                  {location.songs.filter(s => s.lyric).map((song) => (
                    <div key={song.id} className="space-y-1">
                      <p className="text-muted-foreground text-xs italic leading-relaxed">
                        &ldquo;{song.lyric}&rdquo;
                      </p>
                      <p className="text-muted-foreground text-[10px] text-right">
                        — 《{song.name}》({song.year})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 py-3 border-y border-border/60">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              已有 <span className="text-foreground font-semibold">{totalCount.toLocaleString()}</span> 人在此打卡
            </span>
          </div>

          {/* My check-in photos */}
          {myCheckins.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-foreground font-semibold text-sm">我的打卡记录</h2>
              {myCheckins.map((checkin) => (
                <div key={checkin.id} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}>
                  {checkin.content && <p className="text-foreground text-sm leading-relaxed">{checkin.content}</p>}
                  {checkin.photos.length > 0 && (
                    <div className={`grid gap-2 ${checkin.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      {checkin.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt="" className="w-full aspect-square object-cover rounded-xl" />
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {new Date(checkin.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
              评论 ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">还没有评论，来写下第一条吧</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 overflow-hidden">
                      {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground">{comment.profiles?.nickname?.[0] ?? '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {comment.profiles?.nickname ?? '未知用户'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                        </span>
                        {user && comment.user_id === user.id && (
                          <button onClick={() => handleDelete(comment.id)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">{comment.comment_content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hasMore && (
              <button onClick={() => loadComments(page + 1)} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                加载更多
              </button>
            )}
          </div>

          {/* Comment input */}
          {user ? (
            <div className="sticky bottom-0 pt-2">
              <div className="flex gap-2 p-3 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的评论..."
                  maxLength={200}
                  className="flex-1 px-3 py-2 rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none border border-border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 rounded-xl text-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <button onClick={() => router.push('/login')} className="text-primary text-xs underline underline-offset-4">
                登录后发表评论
              </button>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-border/60 flex gap-3" style={{ background: 'hsl(var(--card)/0.9)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={handleNavigate}
          className="flex-1 py-3 rounded-full border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-primary/40 transition-all"
        >
          <Navigation className="w-4 h-4" />
          立即前往
        </button>
        <button
          onClick={() => checked ? null : router.push(`/checkin/${id}`)}
          disabled={checked}
          className="flex-1 py-3 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={!checked ? { background: 'var(--gradient-bloom)' } : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
        >
          <CheckCircle className="w-4 h-4" />
          {checked ? '已打卡' : '去打卡'}
        </button>
      </div>
    </div>
  );
}

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthProvider>
      <PlaceDetailContent params={params} />
    </AuthProvider>
  );
}