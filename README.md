# 🎮 坦克大战 (Tank Battle)

> 基于 React 19 + Canvas 的经典坦克大战复刻，运行于 [Meoo Cloud](https://meoo.com) 平台。
> 支持单/双人、闯关与无尽模式、Boss 战、道具系统、强化商店与全球排行榜。

<a href="https://vdlm6nwsgniq.meoo.fun" target="_blank" rel="noopener">
  <img src="play-badge.svg" alt="在线体验 Meoo" height="34" />
</a>

🔗 https://vdlm6nwsgniq.meoo.fun

📖 完整文档见 [Wiki](https://github.com/feiluojiang/tank-battle/wiki)

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| **双模式** | 闯关模式（11 关 + Boss）与无尽模式（无限刷怪 + 空袭） |
| **单/双人** | P1: `WASD` + `J`/`Space`；P2: 方向键 + `/`/`Shift右`/`Numpad0` |
| **夜战** | 每 3 关一次夜间关卡，视野受限 |
| **5 种敌人** | 普通 / 快速 / 装甲 / 重型 / Boss，分值递增 |
| **8 种道具** | 星、命、冻、雷、锹、盔、散、速 |
| **强化商店** | 累计积分购买永久开局增益 |
| **全球排行榜** | 基于 Supabase 的云端 Top 20，分模式展示 |
| **主题** | 浅色/深色双主题，支持 iframe 父窗口同步 |
| **触控** | 移动端虚拟摇杆 + 开火键 |
| **合成音效** | Web Audio API 实时合成，无音频文件 |

---

## 🎮 玩法速览

- **目标**：保护己方基地（金色老鹰）不被摧毁，消灭所有敌人通关。
- **生命**：初始 3 条，耗尽且基地被毁即游戏结束。
- **火力升级**：拾「星」道具提升火力（快弹 → 双发 → 强化弹）。
- **连击**：3 秒内连续击杀有连击加分；通关零死亡 +500 分。

| 全局按键 | 功能 |
|----------|------|
| `Enter` | 开始 / 重开 |
| `P` | 暂停 |

> 更多见 [玩法指南](https://github.com/feiluojiang/tank-battle/wiki/玩法指南)

---

## 🛠 技术栈

`React 19` · `TypeScript` · `Vite 7` · `TanStack Router` · `Tailwind CSS 4` · `shadcn/ui` · `Supabase` · `Web Audio API` · `Canvas 2D`

---

## 🚀 本地运行

```bash
pnpm install
pnpm dev          # http://localhost:3015
```

> 端口 **3015** 固定（Meoo 预览系统唯一暴露端口）。

```bash
pnpm build        # tsc --noEmit && vite build → dist/
pnpm typecheck    # 仅类型检查
```

---

## 📁 项目结构

```
src/
├── game/          # 游戏核心：engine / render / sound / maps / constants
├── components/    # React UI：GameCanvas / Hud / Leaderboard / UpgradeShop ...
├── hooks/         # useTankGame（React ↔ 引擎桥接）
├── routes/        # TanStack Router 文件路由（哈希路由）
└── supabase/      # 自动生成的 Supabase 客户端（勿手改）
```

> 架构详解见 [技术架构](https://github.com/feiluojiang/tank-battle/wiki/技术架构)

---

## ☁️ 部署

本项目运行于 Meoo Cloud，部署使用 Meoo CLI：

```bash
meoo deploy --force        # AI/CI：跳过确认，含沙箱推送
```

公网访问地址：**https://vdlm6nwsgniq.meoo.fun** （Meoo CDN 托管，含 Supabase 排行榜云服务）

数据库与排行榜基于 Supabase（RLS 保护），迁移文件在 `migrations/`。

---

## 📚 文档

| Wiki 页面 | 内容 |
|-----------|------|
| [玩法指南](https://github.com/feiluojiang/tank-battle/wiki/玩法指南) | 操作、模式、关卡、计分 |
| [敌人与 Boss](https://github.com/feiluojiang/tank-battle/wiki/敌人与-Boss) | 敌人类型、属性、Boss 机制 |
| [道具系统](https://github.com/feiluojiang/tank-battle/wiki/道具系统) | 8 种道具效果一览 |
| [强化商店](https://github.com/feiluojiang/tank-battle/wiki/强化商店) | 永久升级与积分机制 |
| [排行榜与云端](https://github.com/feiluojiang/tank-battle/wiki/排行榜与云端) | Supabase 排行榜架构 |
| [技术架构](https://github.com/feiluojiang/tank-battle/wiki/技术架构) | 引擎、渲染、声音、状态 |
| [开发指南](https://github.com/feiluojiang/tank-battle/wiki/开发指南) | 本地运行、构建、Meoo 约束 |

---

## 📄 License

个人项目，仅供参考学习。
