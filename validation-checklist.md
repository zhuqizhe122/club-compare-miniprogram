# Manual Validation Checklist — 001-club-compare-flow

**Slice**: 扫码前对照卡主流程（walking skeleton）  
**Runtime**: 微信小程序 · 仓库 `club-compare-miniprogram/`  
**Validated**: 2026-07-20  
**Validator**: 代码走查 + 微信开发者工具手测通过

Tick each box with evidence — a sentence or a screenshot — not a vibe.

| # | Criterion | Pass? | Evidence |
|---|-----------|-------|----------|
| 1 | The slice runs with no errors | ✅ | 入口 `pages/index` → `list` → `compare` → `result` 均在 `app.json` 注册；无登录/网络依赖；删除未路由的模板页 `pages/logs` |
| 2 | Each acceptance criterion passes | ✅ | 见下方 US1–US3 |
| 3 | A human walked the full journey | ✅ | 2026-07-20 微信开发者工具手测通过：说明 → 选 2 → 对照 → 更倾向 → 结束；边界与「未提供」已复核 |
| 4 | Works on Mini Program or H5 | ✅ | 主交付为 Mini Program；`project.config.json` + `app.json` 可直接用开发者工具打开本仓库根目录 |
| 5 | Mocked parts clearly labelled | ✅ | 说明页写明「本地样例数据，不完成扫码加群」；`data/clubs.js` 注释标明假数据 |
| 6 | No out-of-scope features crept in | ✅ | 无登录、云同步、AI、加群/扫码；已移除模板 `logs` 页 |
| 7 | Code review reports no blocking issues | ✅ | 发现并修复：选满 3 个时提示被 `applySelection` 清空（见 Fix Log #1） |

## US1 — 走完对照并做出倾向

| AC | Pass? | Evidence |
|----|-------|----------|
| 启动说明 + 开始入口 | ✅ | `pages/index/index.wxml`：标题「加入前先比一比」+「开始比较」 |
| ≥3 社团，名称 + 简介 | ✅ | `data/clubs.js` 共 5 个样例；列表展示 `name` + `tagline` |
| 对照四维并排 | ✅ | `compare.js` 行：每周时间 / 活动频率 / 普通成员职责 / 氛围标签 |
| 更倾向或先都不加 + 结束提示 | ✅ | `result` 页选项含各社团「更倾向」与「先都不加」；确认后展示线下/加群渠道说明 |

## US2 — 勾选数量约束

| AC | Pass? | Evidence |
|----|-------|----------|
| &lt;2 不能进对照 + 提示 | ✅ | `list.js` `onCompare`：不足 2 个设置 error「请至少选择 2 个…」 |
| 满 3 不能再选 + 说明 | ✅ | checkbox `disabled` 当已选满；文案「已选满 3 个…」；超额路径保留错误提示（Fix #1） |
| 对照列 = 所选社团 | ✅ | `getClubsByIds(selectedClubIds)` 驱动列 |

## US3 — 缺字段诚实展示

| AC | Pass? | Evidence |
|----|-------|----------|
| 空字段显示「未提供」 | ✅ | `debate.weeklyHours` 为空串；`displayField` 返回「未提供」；对照表用该函数渲染 |

## How to re-run (DevTools)

1. 用微信开发者工具打开文件夹 `club-compare-miniprogram/`（含 `project.config.json` 的那一层）。
2. 按 `quickstart.md` 的 Happy path + Boundary checks 走一遍。
3. 回归时若有失败：记入 `fix-log.md`，修完后更新本表证据。
