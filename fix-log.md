# Fix Log — 001-club-compare-flow

Session 5 trail: every failure recorded. Spec change? only when intended behaviour was wrong.

| # | What broke | Why | How we fixed it | Spec change? |
|---|------------|-----|-----------------|--------------|
| 1 | 选满 / 超额时「最多 3 个」提示一闪即消失 | `onCheckChange` 先 `setData({ error })`，随后 `applySelection` 无条件把 `error` 清成 `''` | `applySelection(ids, error)` 保留传入的错误文案；满 3 个时增加常驻提示「已选满 3 个…」；空名册时提示不可比较 | No |
| 2 | 仓库残留微信模板 `pages/logs`（未进路由） | 脚手架默认页未清理，易被当成 scope creep | 删除 `pages/logs/*` | No |

## Notes

- 首轮静态验收未发现主路径崩溃类缺陷；US1–US3 行为与 `spec.md` 一致。
- 若开发者工具手测再发现问题，在本表追加行后再改代码。
