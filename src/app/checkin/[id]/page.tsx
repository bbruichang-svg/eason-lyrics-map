'use client';

import { useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Camera, X, CheckCircle, Music, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { getLocationById } from '@/data/locations';
import { MAX_PHOTOS_PER_CHECKIN, MAX_PHOTO_SIZE_BYTES } from '@/utils/constants';

type CheckinStep = 'verify' | 'form' | 'success';

function CheckinContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const location = getLocationById(id);

  const [step, setStep] = useState<CheckinStep>('verify');
  const [verifying, setVerifying] = useState(false);
  const [checkType, setCheckType] = useState<'real' | 'virtual'>('virtual');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!location) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <p className="text-muted-foreground">地点不存在</p>
      </div>
    );
  }

  const handleVerify = () => {
    setVerifying(true);
    if (!navigator.geolocation) {
      setTimeout(() => { setVerifying(false); setCheckType('virtual'); setStep('form'); }, 1200);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (_pos) => { setVerifying(false); setCheckType('real'); setStep('form'); },
      () => { setVerifying(false); setCheckType('virtual'); setStep('form'); },
      { timeout: 5000 }
    );
  };

  const handleDemoCheckin = () => {
    setCheckType('virtual');
    setStep('form');
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX = 1200;
          if (width > MAX || height > MAX) {
            if (width > height) { height = (height / width) * MAX; width = MAX; }
            else { width = (width / height) * MAX; height = MAX; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size > MAX_PHOTO_SIZE_BYTES) {
              canvas.toBlob((b2) => {
                resolve(new File([b2 ?? blob], file.name, { type: 'image/jpeg' }));
              }, 'image/jpeg', 0.6);
            } else {
              resolve(new File([blob], file.name, { type: blob.type }));
            }
          }, 'image/webp', 0.8);
        };
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > MAX_PHOTOS_PER_CHECKIN) {
      setError(`最多上传 ${MAX_PHOTOS_PER_CHECKIN} 张图片`);
      return;
    }
    const newFiles = [...photoFiles, ...files].slice(0, MAX_PHOTOS_PER_CHECKIN);
    setPhotoFiles(newFiles);

    const urls = await Promise.all(
      newFiles.map((f) => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
      }))
    );
    setPhotos(urls);
    setError(null);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    setSubmitting(true);
    setError(null);

    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photoFiles) {
        const compressed = await compressImage(photo);
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checkin-photos')
          .upload(fileName, compressed, { contentType: 'image/webp', upsert: false });
        if (uploadError) continue;
        const { data: urlData } = supabase.storage.from('checkin-photos').getPublicUrl(uploadData.path);
        if (urlData) photoUrls.push(urlData.publicUrl);
      }

      // Save checkin
      const { error: checkinError } = await supabase.from('checkins').insert({
        user_id: user.id,
        place_id: id,
        check_type: checkType,
        check_photos: photoUrls.length > 0 ? photoUrls : null,
        check_note: content || null,
      });

      if (checkinError) {
        if (checkinError.code === '23505') {
          setError('你已经点亮过该地标足迹');
        } else {
          setError(checkinError.message);
        }
        setSubmitting(false);
        return;
      }

      setStep('success');
    } catch (err) {
      setError('打卡失败，请重试');
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid hsl(var(--border)/0.6)' }}>
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="font-display font-semibold text-foreground text-base">
            打卡 · {location.name}
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{location.city} · {location.country}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Verify */}
        {step === 'verify' && (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full flex items-center justify-center animate-bloom-pulse"
                style={{ background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)' }}>
                <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--primary)/0.18)' }}>
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="font-display font-semibold text-foreground text-2xl">验证位置</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                开启定位，确认你已到达<br />
                <span className="text-foreground font-medium">「{location.name}」</span>
              </p>
              <p className="text-muted-foreground text-xs">无法到达？也可以直接演示打卡</p>
            </div>
            <div className="w-full space-y-3">
              <button
                className="w-full py-3.5 rounded-full text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'var(--gradient-bloom)' }}
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />定位中…</>
                ) : (
                  <><MapPin className="w-4 h-4" />开启定位打卡</>
                )}
              </button>
              <button
                className="w-full py-3.5 rounded-full text-muted-foreground text-sm font-medium transition-all hover:text-foreground disabled:opacity-50"
                style={{ border: '1px solid hsl(var(--border))' }}
                onClick={handleDemoCheckin}
                disabled={verifying}
              >
                演示打卡（无需定位）
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 'form' && (
          <div className="p-5 space-y-5">
            {/* Location confirm */}
            <div className="flex gap-3 rounded-2xl p-3.5" style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}>
              <img src={location.cover} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-foreground">{location.name}</p>
                {location.songs[0] && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Music className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground text-xs">《{location.songs[0].name}》</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-checked text-xs font-semibold self-start mt-0.5">
                <CheckCircle className="w-4 h-4" />
                到达
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">打卡感想（选填）</label>
              <textarea
                className="w-full rounded-2xl p-4 text-foreground text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
                style={{ background: 'var(--glass-bg)', border: '1px solid hsl(var(--glass-border))' }}
                onFocus={(e) => { e.target.style.borderColor = 'hsl(var(--primary))'; }}
                onBlur={(e) => { e.target.style.borderColor = 'hsl(var(--glass-border))'; }}
                rows={3}
                maxLength={100}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`在「${location.name}」，我感受到了…`}
              />
              <div className="flex justify-end">
                <span className="text-muted-foreground text-xs">{content.length}/100</span>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">上传照片（最多3张）</label>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5 text-foreground" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS_PER_CHECKIN && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl flex items-center justify-center transition-all hover:border-primary/50"
                    style={{ border: '2px dashed hsl(var(--border))' }}
                  >
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--checked)/0.12)', border: '1px solid hsl(var(--checked)/0.25)' }}>
                <div className="animate-check-bloom">
                  <CheckCircle className="w-14 h-14 text-checked" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="font-display font-bold text-foreground text-3xl">打卡成功！</h2>
              <p className="text-muted-foreground text-sm">
                我在<span className="text-foreground font-semibold">「{location.name}」</span>完成打卡
              </p>
              {location.songs[0] && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: 'hsl(var(--primary)/0.12)', border: '1px solid hsl(var(--primary)/0.25)' }}>
                  <Music className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary text-sm font-semibold">《{location.songs[0].name}》</span>
                </div>
              )}
            </div>
            <div className="w-full space-y-3">
              <button
                className="w-full py-3.5 rounded-full text-white font-semibold"
                style={{ background: 'var(--gradient-bloom)' }}
                onClick={() => router.push('/profile')}
              >
                查看我的足迹
              </button>
              <button
                className="w-full py-3.5 rounded-full text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                style={{ border: '1px solid hsl(var(--border))' }}
                onClick={() => router.push('/')}
              >
                返回地图
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button for form step */}
      {step === 'form' && (
        <div className="flex-shrink-0 px-5 py-4 border-t border-border/60" style={{ background: 'hsl(var(--card)/0.9)', backdropFilter: 'blur(20px)' }}>
          <button
            className="w-full py-4 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--gradient-bloom)' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />提交中…</>
            ) : (
              <><CheckCircle className="w-5 h-5" />完成打卡</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthProvider>
      <CheckinContent params={params} />
    </AuthProvider>
  );
}