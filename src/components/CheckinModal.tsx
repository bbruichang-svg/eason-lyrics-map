'use client';

import { useState, useRef } from 'react';
import type { SongPlace, Checkin, CheckType } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { MAX_PHOTOS_PER_CHECKIN, MAX_PHOTO_SIZE_BYTES, GPS_RADIUS_LIMIT } from '@/utils/constants';
import { FiX, FiCamera, FiMapPin, FiCloud } from 'react-icons/fi';

interface CheckinModalProps {
  place: SongPlace;
  canRealCheckin: boolean;
  onClose: () => void;
  onSuccess: (checkin: Checkin) => void;
}

export default function CheckinModal({
  place,
  canRealCheckin,
  onClose,
  onSuccess,
}: CheckinModalProps) {
  const [checkType, setCheckType] = useState<CheckType>(
    canRealCheckin ? 'real' : 'virtual'
  );
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取用户GPS位置
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not available'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  };

  // 压缩图片
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // 缩小到大边不超过 1200px
          const MAX = 1200;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = (height / width) * MAX;
              width = MAX;
            } else {
              width = (width / height) * MAX;
              height = MAX;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('压缩失败'));
                return;
              }
              // 如果还是太大，降低质量
              if (blob.size > MAX_PHOTO_SIZE_BYTES) {
                canvas.toBlob(
                  (b2) => {
                    if (!b2) {
                      reject(new Error('压缩失败'));
                      return;
                    }
                    resolve(new File([b2], file.name, { type: 'image/jpeg' }));
                  },
                  'image/jpeg',
                  0.6
                );
              } else {
                resolve(new File([blob], file.name, { type: blob.type }));
              }
            },
            'image/webp',
            0.8
          );
        };
      };
      reader.onerror = reject;
    });
  };

  // 选择图片
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > MAX_PHOTOS_PER_CHECKIN) {
      setError(`最多上传 ${MAX_PHOTOS_PER_CHECKIN} 张图片`);
      return;
    }

    const newPhotos = [...photos, ...files].slice(0, MAX_PHOTOS_PER_CHECKIN);
    setPhotos(newPhotos);

    // 生成预览URL
    const urls = await Promise.all(
      newPhotos.map((f) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => resolve(reader.result as string);
        });
      })
    );
    setPhotoPreviewUrls(urls);
    setError(null);
  };

  // 删除图片
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 提交打卡
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        window.location.href = '/login';
        return;
      }

      let checkLat: number | null = null;
      let checkLng: number | null = null;

      // 实地打卡：获取真实GPS位置
      if (checkType === 'real') {
        try {
          const pos = await getCurrentPosition();
          checkLat = pos.coords.latitude;
          checkLng = pos.coords.longitude;

          // 验证距离
          const R = 6371000;
          const dLat = ((place.lat - checkLat) * Math.PI) / 180;
          const dLng = ((place.lng - checkLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((checkLat * Math.PI) / 180) *
              Math.cos((place.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance > GPS_RADIUS_LIMIT) {
            setError(`距地标 ${Math.round(distance)}m，超过500m限制，请选择云打卡`);
            setSubmitting(false);
            return;
          }
        } catch {
          setError('GPS定位失败，请选择云打卡模式');
          setSubmitting(false);
          return;
        }
      }

      // 上传图片到 Supabase Storage
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const compressed = await compressImage(photo);
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checkin-photos')
          .upload(fileName, compressed, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('checkin-photos')
          .getPublicUrl(uploadData.path);

        if (urlData) {
          photoUrls.push(urlData.publicUrl);
        }
      }

      // 写入打卡记录
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          place_id: place.id,
          check_type: checkType,
          check_lat: checkLat,
          check_lng: checkLng,
          check_photos: photoUrls.length > 0 ? photoUrls : null,
          check_note: note || null,
        })
        .select()
        .single();

      if (checkinError) {
        if (checkinError.code === '23505') {
          setError('你已经点亮过该地标足迹');
        } else {
          setError(checkinError.message);
        }
        setSubmitting(false);
        return;
      }

      onSuccess(checkin);
    } catch (err) {
      setError('打卡失败，请重试');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">
            ✨ 点亮足迹 · {place.city_name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 模式选择 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">选择打卡方式</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCheckType('real')}
                disabled={!canRealCheckin}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  checkType === 'real'
                    ? 'bg-[#1a1a1a] text-white'
                    : canRealCheckin
                    ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <FiMapPin size={14} />
                实地打卡
                {!canRealCheckin && <span className="text-[10px]">(超出范围)</span>}
              </button>
              <button
                onClick={() => setCheckType('virtual')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  checkType === 'virtual'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiCloud size={14} />
                云打卡
              </button>
            </div>
            {checkType === 'real' && (
              <p className="mt-1 text-[10px] text-green-600">
                ✓ GPS验证通过，可实地打卡
              </p>
            )}
            {checkType === 'virtual' && (
              <p className="mt-1 text-[10px] text-blue-600">
                ☁️ 随心点亮，情怀无界
              </p>
            )}
          </div>

          {/* 歌词展示 */}
          {place.lyric_text && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 italic text-center">
                &ldquo;{place.lyric_text}&rdquo;
              </p>
              <p className="text-[10px] text-gray-400 text-center mt-1">
                — {place.song_title}
              </p>
            </div>
          )}

          {/* 打卡随笔 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              打卡随笔（选填）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="写下此刻的感受..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:border-[#d4b886] focus:outline-none resize-none"
            />
            <p className="text-[10px] text-gray-400 text-right mt-1">
              {note.length}/200
            </p>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              上传图片（选填，最多{MAX_PHOTOS_PER_CHECKIN}张）
            </label>
            <div className="flex flex-wrap gap-2">
              {photoPreviewUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Preview ${i}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <FiX size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS_PER_CHECKIN && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:border-[#d4b886] hover:text-[#d4b886] transition-colors"
                >
                  <FiCamera size={16} />
                  <span className="text-[8px]">上传</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '提交中...' : '✨ 点亮足迹'}
          </button>
        </div>
      </div>
    </div>
  );
}