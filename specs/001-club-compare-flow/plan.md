# 001 — 实现计划基线

> 本文记录当前已经存在的实现结构，不代表新的技术改造计划。

## 架构

| 层 | 当前实现 |
|---|---|
| 页面 | 微信小程序四页：index、list、compare、result |
| 数据源 | `data/clubs.js` 本地样例数组 |
| 会话状态 | `app.js` 的 `globalData.preferenceAnswers`、`recommendations`、`selectedClubIds` 和 `tendency` |
| 数据传递 | 页面从 `getApp().globalData` 读取，不使用 URL 参数 |
| 后端与持久化 | 无 |
| 外部依赖 | 无新增 npm 依赖 |
| 决策纯函数 | `data/clubs.js` 生成差异摘要和预期卡；`utils/booth-questions.js` 生成现场追问 |

## 页面职责

- `index`：说明用途，开始新一轮比较并清空旧状态。
- `list`：同页承载四题 Top 6 与搜索/分类双模式，维护跨模式一致的 2–3 个候选并写入会话态。
- `compare`：读取已选 ID，按选择顺序生成四维并排对照，高亮不同项并摘要关键差异。
- `result`：提供各候选倾向和“先都不加”，确认后生成中文预期卡、最多 3 条现场追问及线下加入提示。

## 已接入的决策支持

- 比较页消费 `getDifferenceSummary()` 高亮真正不同的维度并展示前两项关键摘要。
- 结果页消费 `getExpectationCards()`，只为当前倾向生成带确认状态的中文预期卡；“先都不加”使用专用行动卡。
- 结果页消费 `generateBoothQuestions()` 展示最多 3 条现场追问。
- 页面只读取消费本地 CommonJS 模块，不引入后端、网络、随机数、LLM 或新路由。

## 状态与返回

- 从比较页返回一层进入选择页，保留页面实例及 `globalData` 中的答案、Top 6 和候选。
- 结果页返回调整跨两层回到选择页；重新开始调用 `resetSelection()` 并重启到首页。
- 当前状态不写入 Storage，关闭重开不承诺恢复。

## 变更顺序

1. 行为变化先更新 `spec.md`。
2. 数据结构变化先更新 `docs/data-contract.md`。
3. 修改代码并保持 Issue 范围小而单一。
4. 更新验证记录，人工在微信开发者工具中回归。
5. 检查 diff，人工批准后才 commit 和创建 PR。
