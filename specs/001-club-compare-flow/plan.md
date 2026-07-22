# 001 — 实现计划基线

> 本文记录当前已经存在的实现结构，不代表新的技术改造计划。

## 架构

| 层 | 当前实现 |
|---|---|
| 页面 | 微信小程序四页：index、list、compare、result |
| 数据源 | `data/clubs.js` 本地样例数组 |
| 会话状态 | `app.js` 的 `globalData.selectedClubIds` 和 `globalData.tendency` |
| 数据传递 | 页面从 `getApp().globalData` 读取，不使用 URL 参数 |
| 后端与持久化 | 无 |
| 外部依赖 | 无新增 npm 依赖 |

## 页面职责

- `index`：说明用途，开始新一轮比较并清空旧状态。
- `list`：展示样例、维护 2–3 个选择约束、写入已选 ID。
- `compare`：读取已选 ID，生成四个固定维度的并排对照。
- `result`：生成倾向选项、记录结果并提示线下完成真实加入。

## 变更顺序

1. 行为变化先更新 `spec.md`。
2. 数据结构变化先更新 `docs/data-contract.md`。
3. 修改代码并保持 Issue 范围小而单一。
4. 更新验证记录，人工在微信开发者工具中回归。
5. 检查 diff，人工批准后才 commit 和创建 PR。
