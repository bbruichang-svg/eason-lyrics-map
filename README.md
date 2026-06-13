# 🎵 Eason歌词足迹打卡地图

> 陈奕迅歌迷专属全球歌词地标互动地图 — 实地GPS打卡 / 云打卡点亮足迹，留存城市听歌故事

![Tech Stack](https://img.shields.io/badge/Next.js%2015-000000?style=flat&logo=next.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel)

## 🔗 快速链接

- [数据库建表脚本](./supabase/schema.sql)
- [点位种子数据](./supabase/seed-places.sql)

## ✨ 功能一览

| 功能 | 状态 |
|------|------|
| 🗺️ 全球歌词地标地图（Leaflet） | ✅ |
| 🔍 按歌曲/城市/地区/类型筛选 | ✅ |
| 📍 GPS实地打卡（≤500米核验） | ✅ |
| ☁️ 情怀云打卡（无限制） | ✅ |
| 👤 邮箱/谷歌登录（Supabase Auth） | ✅ |
| 📸 打卡图片上传（自动压缩） | ✅ |
| 📊 个人足迹统计 + 时间线 | ✅ |
| 💬 点位评论互动 | ✅ |
| 📱 全端自适应 | ✅ |
| 🚀 Vercel 一键部署 | ✅ |

## 🛠️ 技术栈

- **前端**：Next.js 15 (App Router) + TailwindCSS
- **地图**：react-leaflet + Leaflet（免费开源，无调用限额）
- **数据库**：Supabase (PostgreSQL + RLS 行级权限)
- **鉴权**：Supabase Auth（邮箱 + Google 登录）
- **存储**：Supabase Storage（图片上传）
- **部署**：Vercel（自动SSL + CDN）
- **AI开发**：Claude Code（代码生成）、OpenRouter（辅助调试）

> **无服务器、零运维、全程免费套餐**

## 🚀 快速开始

### 前置条件

- Node.js 18+
- Supabase 项目（免费版即可）
- Vercel 账号（可选，用于部署）

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd eason-map
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 Supabase 项目信息：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. 配置 Supabase

在 [Supabase Dashboard](https://supabase.com) 中：

1. **创建项目**（选择免费版）
2. **执行 SQL 建表**：打开 SQL Editor，粘贴执行 `supabase/schema.sql`
3. **导入点位数据**：执行 `supabase/seed-places.sql`
4. **创建 Storage Bucket**：
   - Storage → 创建名为 `checkin-photos` 的公开 bucket
   - 设置 RLS 策略（允许认证用户上传）
5. **配置 Auth 设置**：
   - Authentication → Settings → 启用邮箱登录
   - 添加 Google OAuth 凭据（可选）

### 4. 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 5. 部署到 Vercel

```bash
git add .
git commit -m "init: Eason歌词足迹地图"
git push
```

在 Vercel 中导入仓库 → 自动识别 Next.js → 添加环境变量 → 部署完成 🎉

## 📁 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页（主地图）
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式
│   ├── login/page.tsx        # 登录页
│   ├── profile/page.tsx      # 个人中心
│   └── place/[id]/page.tsx   # 点位详情 + 评论
├── components/
│   ├── AuthProvider.tsx       # 登录态上下文
│   ├── MapWrapper.tsx        # 地图动态加载包装
│   ├── LeafletMap.tsx        # 核心地图组件
│   ├── MapFilterBar.tsx      # 搜索/筛选栏
│   ├── MapHeader.tsx         # 用户入口
│   ├── PlacePopupContent.tsx # 点位弹窗
│   └── CheckinModal.tsx      # 打卡弹窗
├── lib/
│   └── supabase.ts           # Supabase 客户端
├── types/
│   └── database.ts           # TypeScript 类型
├── hooks/
│   └── useAuth.ts            # 鉴权 Hook
└── utils/
    ├── constants.ts          # 全局常量
    └── cn.ts                 # CSS 工具函数
supabase/
├── schema.sql                # 建表 + RLS
└── seed-places.sql           # 点位种子数据
```

## 📐 视觉规范

- **主色**：复古鎏金 `#d4b886`
- **辅色**：深空灰 `#1a1a1a`
- **背景**：浅灰白 `#f5f5f5`
- **点位颜色**：歌词🔵蓝 / MV🩷粉 / 巡演🔴红 / 艺人🟡金

## 📄 版权声明

本网站仅展示歌词短句，不展示完整歌词或音频内容。
歌词版权归属所属唱片公司，本网站仅歌迷非公益情怀使用。
如版权方认为存在侵权，请联系下架。

## 📋 许可证

MIT