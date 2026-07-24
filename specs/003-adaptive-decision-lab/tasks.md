# 003 — 自适应社团决策实验室任务清单

> 仅勾选当前代码或已执行自动断言能够直接证明的工作；等价能力允许落在本轮重构后的实际模块中。涉及微信 CLI、微信开发者工具、真机、布局可读性、版本化快照或人工审查而尚无证据的任务保持未勾选。

## Phase 1：规格与迁移准备

- [ ] T001 核对 003、主计划、ADR 与字段命名的一致性，更新 `specs/003-adaptive-decision-lab/`
- [ ] T002 冻结题目 ID、答案枚举和依赖关系到 `data/assessment-questions.js`
- [ ] T003 冻结六维兼容矩阵与压力情境到 `data/decision-rules.js`
- [ ] T004 [P] 为 98 社制定字段级 evidence 补录清单到 `docs/data-evidence-audit.md`
- [ ] T005 在 `app.js` 增加版本化 `decisionSession`、重置和失效传播接口

## Phase 2：基础规则与数据合同

- [x] T006 为当前 98 社补充 `decisionProfile` 与字段级 `evidence` 到 `data/clubs.js`
- [x] T007 在 `data/clubs.js` 增加严格读取、未知降级和 evidence 引用辅助函数
- [x] T008 [P] 实现 8–14 题确定性规划器到 `utils/adaptive-assessment.js`
- [x] T009 [P] 实现硬约束 `PASS/FAIL/UNKNOWN` 引擎到 `utils/hard-constraints.js`
- [x] T010 [P] 实现六维 0–100 偏好匹配和独立置信度到 `utils/preference-match.js`
- [x] T011 [P] 实现标准与相关情境压力测试到 `utils/stress-test.js`
- [ ] T012 实现版本化推荐、稳定排序和逐维解释到 `utils/recommendation.js`
- [x] T013 实现结果报告与最多 5 条核实问题到 `utils/decision-report.js`
- [ ] T014 为题序、三值、原型推断禁 PASS、分数重算和压力结果增加 `tests/adaptive-decision.test.js`
- [ ] T015 为会话失效传播与页面前置守卫增加 `tests/decision-session.test.js`

## Phase 3：US1 自适应评估（P1）

**独立验收**：从首页完成最短 8 题与最长 14 题路径；返回修改答案后，受影响题目和下游快照正确失效。

- [x] T016 [P] [US1] 更新专业版用途与会话重置入口到 `pages/index/index.js`
- [x] T017 [P] [US1] 更新专业版说明与开始界面到 `pages/index/index.wxml`
- [x] T018 [P] [US1] 创建单题、自适应原因和进度逻辑到 `pages/assessment/assessment.js`
- [x] T019 [P] [US1] 创建 8–14 题评估界面到 `pages/assessment/assessment.wxml`
- [x] T020 [P] [US1] 创建评估页面样式到 `pages/assessment/assessment.wxss`
- [x] T021 [US1] 接入答案修改、依赖回滚和推荐重算到 `pages/assessment/assessment.js`

## Phase 4：US2 + US3 推荐决策（P1）

**独立验收**：固定数据下明确区分 PASS、FAIL、UNKNOWN；原型推断零 PASS；每个匹配分可由逐维贡献精确重算。

- [ ] T022 [P] [US2] 创建推荐/排除分组和硬约束解释到 `pages/recommend/recommend.js`
- [ ] T023 [P] [US2] 创建三值状态与需核实界面到 `pages/recommend/recommend.wxml`
- [ ] T024 [P] [US3] 创建分数、置信度和逐维解释组件到 `components/match-breakdown/`
- [ ] T025 [US3] 在推荐页接入 0–100 分、置信度、加分和冲突解释到 `pages/recommend/recommend.js`
- [ ] T026 [US2] 校验全 FAIL、全 UNKNOWN 和同分稳定排序空态到 `pages/recommend/recommend.js`

## Phase 5：US4 资料探索与候选篮（P2）

**独立验收**：用户可从推荐和资料库任一路径打开详情并组成同一 2–3 候选篮；每个决策字段均显示 evidence。

- [x] T027 [P] [US4] 创建搜索、多维筛选和证据状态逻辑到 `pages/library/library.js`
- [x] T028 [P] [US4] 创建资料库结果与可恢复空态到 `pages/library/library.wxml`
- [ ] T029 [P] [US4] 创建字段值、等级、来源与时间展示到 `pages/club/club.js`
- [ ] T030 [P] [US4] 创建社团详情和逐字段 evidence 界面到 `pages/club/club.wxml`
- [x] T031 [P] [US4] 创建共享候选篮组件到 `components/selection-tray/`
- [ ] T032 [US4] 创建 2–3 边界、来源和过期状态逻辑到 `pages/selection/selection.js`
- [x] T033 [US4] 创建候选管理与证据缺口界面到 `pages/selection/selection.wxml`
- [x] T034 [US4] 联通推荐、资料库、详情和候选页共享状态到 `app.js`

## Phase 6：US5 深度比较（P2）

**独立验收**：按加入顺序比较 2 个和 3 个候选；三个标准压力情境均输出可追溯三值结果，未知证据不产生 RESILIENT。

- [x] T035 [P] [US5] 将比较数据升级为硬约束、六维偏好和基础字段到 `pages/compare/compare.js`
- [x] T036 [P] [US5] 创建字段级 evidence 与未知差异展示到 `pages/compare/compare.wxml`
- [ ] T037 [P] [US5] 创建标准及相关情境压力面板到 `components/stress-test/`
- [ ] T038 [US5] 接入候选/评估版本守卫和过期重算到 `pages/compare/compare.js`
- [ ] T039 [US5] 验证 2 列、3 列和小屏横向可读样式到 `pages/compare/compare.wxss`

## Phase 7：US6 结果报告（P1）

**独立验收**：三种非绑定性结论均能生成报告；事实可追溯、未知完整列出、核实问题不超过 5 条。

- [ ] T040 [P] [US6] 接入三种结论、快照与报告生成到 `pages/result/result.js`
- [ ] T041 [P] [US6] 创建报告摘要、三值、分数、置信度和压力结果界面到 `pages/result/result.wxml`
- [x] T042 [P] [US6] 创建逐项 evidence 边界和最多 5 条核实问题界面到 `pages/result/result.wxml`
- [ ] T043 [US6] 接入返回调整、过期守卫和重新开始到 `pages/result/result.js`

## Phase 8：路由收口与跨切面验证

- [x] T044 将 `app.json` 收敛为批准八页并删除旧 `pages/list` 注册
- [ ] T045 收紧 `scripts/validate-project.js` 为目标八页精确路由断言
- [x] T046 [P] 更新 `scripts/validate-data.js` 验证 decisionProfile、字段 evidence 和枚举
- [ ] T047 [P] 更新 `tests/page-state.test.js` 覆盖八页前置守卫与返回路径
- [ ] T048 运行并修复 `scripts/` 与 `tests/` 下全部 Node 校验及 001/002 checkpoint 回归
- [ ] T049 按 `specs/003-adaptive-decision-lab/quickstart.md` 完成微信开发者工具主路径与边界验收
- [x] T050 仅在有实际证据后更新 `validation-checklist.md` 与 `fix-log.md`
- [ ] T051 人工检查仓库根目录 `.` 的完整 diff，确认无网络、Storage、LLM、新依赖或第九页后再申请 commit

## 依赖关系

- Phase 1 → Phase 2，是所有页面实现的阻塞前置。
- Phase 3 完成后才能做 Phase 4；Phase 4 与 Phase 5 可部分并行。
- Phase 5 的有效 2–3 候选篮阻塞 Phase 6。
- Phase 2、4、6 共同阻塞 Phase 7。
- Phase 8 只能在所有用户故事独立验收后收口。

## 并行机会

- T008–T011 可在接口冻结后按不同纯函数文件并行。
- 每页的 JS、WXML、WXSS 可由明确单一集成人员协调后并行。
- 数据审核 T004 可与规则骨架并行，但 T006 必须等待审核映射冻结。

## 建议 MVP

第一可评审增量为 Phase 1–4：保留旧四页回归能力，同时证明“8–14 题 → 三值硬约束 → 可解释 0–100 推荐”。资料库、候选篮、压力测试和报告不应被伪装成该 MVP 已完成。

## 格式检查

任务 ID 为 T001–T051；用户故事任务均带 `[USn]`，可并行且不写同一文件的任务标记 `[P]`，每项均给出目标路径。
