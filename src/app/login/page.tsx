'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function LoginContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (user && !redirecting) {
      setRedirecting(true);
      router.push('/');
    }
  }, [user, router, redirecting]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <div className="w-full max-w-sm">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-xs text-gray-500 mb-6 hover:text-gray-700 transition-colors"
        >
          <FiArrowLeft size={14} />
          返回地图
        </button>

        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🎵</div>
          <h1 className="text-lg font-semibold text-gray-900">Eason歌词足迹地图</h1>
          <p className="text-xs text-gray-500 mt-1">登录后即可点亮足迹，收藏听歌故事</p>
        </div>

        {/* Supabase Auth UI */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1a1a1a',
                    brandAccent: '#333333',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f5f5f5',
                    defaultButtonBackgroundHover: '#e5e5e5',
                    inputBackground: '#f5f5f5',
                    inputBorder: '#e5e5e5',
                    inputBorderFocus: '#d4b886',
                    inputText: '#1a1a1a',
                  },
                  fonts: {
                    bodyFontFamily: 'system-ui, sans-serif',
                    buttonFontFamily: 'system-ui, sans-serif',
                    inputFontFamily: 'system-ui, sans-serif',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
              },
            }}
            providers={['google']}
            providerScopes={{ google: 'email profile' }}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : '/'}
            onlyThirdPartyProviders={false}
            magicLink={false}
          />
        </div>

        {/* 底部说明 */}
        <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
          登录即表示你同意我们的服务条款
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginContent />
    </AuthProvider>
  );
}