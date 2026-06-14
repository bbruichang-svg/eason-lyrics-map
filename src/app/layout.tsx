import type { Metadata } from 'next';
import './globals.css';
import I18nProvider from './I18nProvider';

export const metadata: Metadata = {
  title: 'Eason歌词足迹打卡地图',
  description: '陈奕迅歌迷专属全球歌词地标互动地图 — 实地GPS打卡/云打卡点亮足迹，留存城市听歌故事',
  keywords: ['陈奕迅', 'Eason', '歌词地图', '打卡', '歌迷', '足迹地图'],
  openGraph: {
    title: 'Eason歌词足迹打卡地图',
    description: '点亮你的Eason足迹，收藏城市的听歌故事',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}