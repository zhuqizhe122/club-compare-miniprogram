# Pull Request 模板

> 当前为团队手工复制模板，不会自动改变 GitHub PR 配置。

## Related Issue

Closes #

## Summary

- Files changed：
- Behaviour changed：
- Spec / milestones impact：

## Scope check

- [ ] 一个 Issue、一个负责人、一个分支
- [ ] 未加入 Issue 范围外的重构或功能
- [ ] 未增加未经批准的依赖、后端、登录、AI、支付或分析 SDK
- [ ] 数据结构变化已先更新 `docs/data-contract.md`
- [ ] 行为变化已先更新相关 spec

## Shared files

- 是否修改 `app.json`、`app.js`、`data/clubs.js` 或公共组件：
- 指定负责人及协调方式：

## How to test

### Static

- [ ] `git diff --check`
- [ ] 已人工阅读完整 `git diff`

### WeChat DevTools

- [ ] 已按相关 `quickstart.md` 验证
- 验证人：
- 验证日期：
- 证据或说明：

## Review

- [ ] 由另一名成员 Review
- [ ] 所有阻断意见已处理
- Reviewer：
