# Eason歌词足迹打卡地图 - 融合改造计划

## 目标
将 enter-MusicMap 的 **Misty Garden 设计系统 + 新颖 UI/UX** 集成到当前 **Next.js + Supabase** 项目中，保留：
- ✅ Next.js 16 App Router（SSR/SSG）
- ✅ Supabase 数据库 + Auth + Storage
- ✅ Vercel 部署

## 架构概览

```
src/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx          # 全局布局（Misty Garden 主题 + 字体 + i18n）
│   ├── page.tsx            # 主页（地图 + Header + 位置卡片 + BottomNav）
│   ├── login/page.tsx      # 登录页（保留 Supabase Auth UI）
│   ├── place/[id]/page.tsx # 地点详情页（Misty Garden 风格 + 评论）
│   ├── checkin/[id]/page.tsx # 3步打卡页面（Verify → Form → Success）
│   ├── profile/page.tsx    # 个人主页（进度卡片 + 迷你地图 + 成就徽章 + 打卡记录）
│   └── not-found.tsx       # 404 页
├── components/
│   ├── ui/                 # shadcn/ui 组件（从 enter-MusicMap 移植）
│   ├── MapWrapper.tsx      # 动态导入 LeafletMap
│   ├── LeafletMap.tsx      # 地图组件（使用 enter-MusicMap 的 SVG 标记 + Voyager tiles）
│   ├── AuthProvider.tsx    # Supabase Auth 上下文
│   ├── MapHeader.tsx       # 顶部栏（带语言切换）
│   ├── MapFilterBar.tsx    # 筛选栏（适配 Misty Garden）
│   ├── BottomNav.tsx       # 底部导航（音乐地图 / 我的足迹）
│   ├── LocationCard.tsx    # 位置卡片弹窗（底部上滑）
│   ├── AchievementBadge.tsx # 成就徽章
│   ├── CheckinModal.tsx    # 打卡弹窗（保留现有的 Supabase 逻辑）
│   ├── LoadingSpinner.tsx  # 加载动画
│   └── language-switcher.tsx # 语言切换器
├── lib/
│   ├── supabase.ts         # Supabase 客户端（保留）
│   ├── utils.ts            # cn() 工具函数
│   └── useCheckins.ts      # 打卡 hook（改造为 Supabase 驱动）
├── types/
│   └── database.ts         # 数据库类型（扩展）
├── data/
│   └── locations.ts        # 20 个地标数据（从 enter-MusicMap 移植）
├── utils/
│   ├── constants.ts        # 常量和点位类型配置
│   └── cn.ts               # 备用（合并到 lib/utils.ts）
├── i18n/
│   ├── config.ts           # i18next 配置
│   └── util.ts             # i18n 工具
└── analytics.ts            # 分析工具（可选移植）
```

## 分步实施计划

### Phase 1: 设计系统迁移
1. 替换 `globals.css` → 导入 Misty Garden CSS 变量、动画、Leaflet 滤镜
2. 创建 `tailwind.config.ts` 以支持 Tailwind v3 (需要降级从 v4)
3. 安装新依赖：`lucide-react`, `framer-motion`, 必要 shadcn/ui 组件
4. 更新 `layout.tsx` → 添加 Google Fonts（Playfair Display + Inter）

### Phase 2: 数据层迁移
5. 移植 `data/locations.ts` → 20 个 Eason 地标数据
6. 改造 `useCheckins` → 使用 Supabase 替代 localStorage
7. 扩展数据库类型以匹配新数据模型

### Phase 3: 页面改造
8. **首页** → 融合 enter-MusicMap 的 UI（Header 渐变 + LocationCard 底部滑出 + BottomNav + 图例）
9. **地点详情页** → Misty Garden 风格（Hero 图 + 玻璃卡片 + 底部操作栏）
10. **打卡页面** → 3步流程（Verify → Form → Success），保留 Supabase 上传逻辑
11. **个人主页** → 进度卡片 + 迷你地图 + 成就徽章 + 打卡历史
12. **登录页** → 保持现有 Supabase Auth，适配暗黑主题
13. **404** → Misty Garden 风格

### Phase 4: 新增功能
14. **国际化 i18n** → i18next 配置 + 中英文 locales
15. **语言切换器** → 在页面右上角添加
16. **底部导航** → 地图/个人主页切换

### Phase 5: 部署
17. 更新 .env.example，推送 GitHub，Vercel 部署

## 关键技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| Tailwind 版本 | **v3 + tailwindcss-animate** | Misty Garden + shadcn/ui 需要 v3 的 config 文件 |
| PostCSS 插件 | `@tailwindcss/postcss` (v4 兼容) | Next.js 16 内置支持 |
| 图标库 | **lucide-react** | enter-MusicMap 使用，替换 react-icons |
| 动画库 | **CSS 动画为主 + framer-motion** | 避免运行时开销 |
| i18n | **i18next + react-i18next** | 与 enter-MusicMap 一致 |
| 地图瓦片 | **CartoDB Voyager** + CSS 滤镜 | 实现 overcast sky 效果 |
| shadcn/ui | 按需安装（button, card, select, dialog 等）| |

## 注意事项
- Next.js 16 与 Tailwind v4 有差异，需降级到 v3 以支持 `tailwind.config.ts`
- `postcss.config.mjs` 需要切换到支持 Tailwind v3 的配置
- Leaflet 的 CSS 滤镜效果只在 CartoDB Voyager 瓦片上有效
- 所有 `react-icons/fi` 替换为 `lucide-react`
- i18n 需要修改布局为 client component（或者用 i18n server component 方式）