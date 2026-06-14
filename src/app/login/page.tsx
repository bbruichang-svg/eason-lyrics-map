'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Music2 } from 'lucide-react';
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
    <div className="h-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-xs text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          返回地图
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'var(--gradient-bloom)', boxShadow: 'var(--shadow-bloom)' }}>
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-semibold text-xl text-foreground">Eason歌词足迹地图</h1>
          <p className="text-xs text-muted-foreground mt-1">登录后即可点亮足迹，收藏听歌故事</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid hsl(var(--glass-border))' }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(338 58% 57%)',
                    brandAccent: 'hsl(338 58% 65%)',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'hsl(224 20% 13%)',
                    defaultButtonBackgroundHover: 'hsl(224 16% 20%)',
                    inputBackground: 'hsl(224 22% 9%)',
                    inputBorder: 'hsl(224 16% 22%)',
                    inputBorderFocus: 'hsl(338 58% 57%)',
                    inputText: 'hsl(220 18% 88%)',
                  },
                  fonts: {
                    bodyFontFamily: 'Inter, sans-serif',
                    buttonFontFamily: 'Inter, sans-serif',
                    inputFontFamily: 'Inter, sans-serif',
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

        <p className="text-[10px] text-muted-foreground text-center mt-6 leading-relaxed">
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