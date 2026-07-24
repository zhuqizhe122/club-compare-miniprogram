# 社团决策罗盘

面向第一次接触大量社团的新生：先用 4 个轻量偏好问题把 98 个本地候选缩成可解释的 Top 6，也可直接搜索；再选 2–3 个并排比较，最后形成“更倾向某社团”或“先都不加”的非绑定性判断，并带着中文预期卡和 3 个问题去招新现场核实。

它解决的不是“替用户推荐最优社团”，而是把宣传信息转成可比较、可追问的决策依据。

## 四页链路

1. `pages/index`：说明产品价值、数据边界和开始入口。
2. `pages/list`：同页双模式。回答 4 题查看 Top 6 与匹配理由，或按关键词和分类直接搜索；从任一模式选择 2–3 个候选。
3. `pages/compare`：按选择顺序展示四维对照，高亮不同项，并摘要关键差异。
4. `pages/result`：记录倾向或“先都不加”，生成中文预期卡和最多 3 条现场追问。

## 数据与能力边界

- 98 个社团与全部决策规则均在本地；运行时零网络请求、无后端、无账号、无云开发。
- 匹配采用固定权重与确定性排序，不使用 AI、LLM、随机数或第三方推荐服务。
- 社团名称来自当前名单；介绍、分类、投入等结构化内容是原型演示资料，统一标为“待社团确认”，不能视作官方承诺。
- 选择、答题和倾向只保存在当前小程序会话内，不写入本地存储；重开小程序不承诺保留。
- 小程序不完成扫码、加群或报名，真实加入在线下渠道进行。

## 用微信开发者工具打开

1. 安装并打开微信开发者工具，选择“导入项目”。
2. 项目目录选择本仓库根目录，即同时包含 `project.config.json` 与 `app.json` 的目录。
3. AppID 可使用测试号；不需要安装 npm 依赖，也不需要启动服务器。
4. 编译后从首页依次走 `index → list → compare → result`。完整人工验收步骤见 `validation-checklist.md` 和 `DEMO-SCRIPT.md`。

## Node 静态校验

在仓库根目录执行：

```text
node scripts/validate-project.js
node scripts/validate-data.js
node tests/decision-rules.test.js
node tests/page-state.test.js
```

四条命令应以退出码 0 结束。它们验证项目结构、数据、规则与关键页面状态，不替代微信开发者工具中的页面人工验收。

## 文档索引

- 产品方向：`master-plan.md`
- 主流程规格：`specs/001-club-compare-flow/`
- 偏好分流规格：`specs/002-preference-triage/`
- 数据契约：`docs/data-contract.md`
- 验收与回归：`validation-checklist.md`、`fix-log.md`
- 2–3 分钟演示：`DEMO-SCRIPT.md`
