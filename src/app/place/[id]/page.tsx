'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { SongPlace, Comment, Profile } from '@/types/database';
import { PLACE_TYPE_CONFIG, COMMENTS_PAGE_SIZE } from '@/utils/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FiArrowLeft, FiSend, FiTrash2 } from 'react-icons/fi';

interface CommentWithProfile extends Comment {
  profiles: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

function PlaceDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [place, setPlace] = useState<SongPlace | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [checkinCount, setCheckinCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: placeData } = await supabase
        .from('songs_places')
        .select('*')
        .eq('id', id)
        .single();

      setPlace(placeData);

      // 打卡人数
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', id);

      setCheckinCount(count ?? 0);

      // 评论
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
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        )
      `)
      .eq('place_id', id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      const typedData = data as unknown as CommentWithProfile[];
      if (pageNum === 0) {
        setComments(typedData);
      } else {
        setComments((prev) => [...prev, ...typedData]);
      }
      setHasMore(typedData.length === COMMENTS_PAGE_SIZE);
      setPage(pageNum);
    }
  };

  // 发布评论
  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({
        place_id: id,
        user_id: user.id,
        comment_content: newComment.trim(),
      })
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        )
      `)
      .single();

    if (!error && data) {
      setComments((prev) => [data as unknown as CommentWithProfile, ...prev]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  // 删除评论
  const handleDelete = async (commentId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="加载中..." />;
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">点位不存在</p>
          <Link href="/" className="text-xs text-[#d4b886] hover:underline">
            返回地图
          </Link>
        </div>
      </div>
    );
  }

  const typeConfig = PLACE_TYPE_CONFIG[place.place_type];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 truncate">
            {place.city_name}
          </h1>
          <span
            className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium text-white ml-auto"
            style={{ backgroundColor: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 地标信息卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          {place.lyric_text && (
            <p className="text-sm text-gray-600 italic text-center leading-relaxed">
              &ldquo;{place.lyric_text}&rdquo;
            </p>
          )}

          <div className="text-center">
            <h2 className="font-semibold text-base text-gray-900">{place.song_title}</h2>
            {place.album_name && (
              <p className="text-xs text-gray-400 mt-0.5">专辑：{place.album_name}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-50">
            <span>📍 {place.country_area}</span>
            <span>🏷️ {checkinCount} 人已打卡</span>
          </div>

          {place.place_story && (
            <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3">
              {place.place_story}
            </p>
          )}
        </div>

        {/* 评论列表 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wide">
            评论 ({comments.length})
          </h3>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">
                还没有评论，来写下第一条吧
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                    {comment.profiles?.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">
                        {comment.profiles?.nickname?.[0] ?? '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {comment.profiles?.nickname ?? '未知用户'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      {user && comment.user_id === user.id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                          title="删除评论"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {comment.comment_content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <button
              onClick={() => loadComments(page + 1)}
              className="w-full mt-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              加载更多
            </button>
          )}
        </div>

        {/* 评论输入框 */}
        {user ? (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 rounded-t-2xl shadow-lg">
            <div className="max-w-lg mx-auto px-4 py-3 flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                maxLength={200}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:border-[#d4b886] focus:outline-none border border-transparent transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2 rounded-xl text-sm text-white bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Link
              href="/login"
              className="text-xs text-[#d4b886] hover:underline"
            >
              登录后发表评论
            </Link>
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

export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AuthProvider>
      <PlaceDetailContent params={params} />
    </AuthProvider>
  );
}