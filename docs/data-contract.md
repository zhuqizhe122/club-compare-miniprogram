# 社团数据契约

> 本契约同时记录当前 001/002 checkpoint 与 003 专业版目标合同。当前 `data/clubs.js` 仍以旧扁平字段为实现基线；标注“003 计划”的字段尚不能据本文档宣称已经存在。社团名称沿用已有名单；未经字段级来源证明的文案和结构化字段都不是官方资料。

## Club 对象

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `id` | string | 是 | 唯一、稳定的内部标识，用于会话选择和倾向值 |
| `name` | string | 是 | 用户可见的社团名称，非空 |
| `tagline` | string | 是 | 选择页展示的简短介绍，非空 |
| `weeklyHours` | string | 否 | 每周时间投入 |
| `frequency` | string | 否 | 活动频率 |
| `memberRole` | string | 否 | 普通成员通常承担的职责 |
| `vibe` | string | 否 | 社团氛围标签或简述 |
| `category` | string | 是 | 分类代码，见下方枚举 |
| `categoryLabel` | string | 是 | 分类的中文显示名 |
| `tags` | string[] | 是 | 用于搜索和快速浏览的演示标签 |
| `searchAliases` | string[] | 是 | 本地搜索别名，不作为显示名称 |
| `timeBand` | string | 是 | 演示级常见时段分类 |
| `intensity` | string | 是 | 演示级投入强度 |
| `socialStyle` | string | 是 | 演示级互动方式 |
| `skillBarrier` | string | 是 | 演示级入门门槛 |
| `commitment` | string | 是 | 演示级参与承诺 |
| `dataStatus` | string | 是 | 固定为“待社团确认” |

约束：

- `id` 在同一数据集中必须唯一；已有 ID 不应仅因文案变化而修改。
- 四个比较字段允许使用 `null`、`undefined`、空字符串或仅空白表示缺失。
- 缺失比较字段必须通过 `displayField()` 显示为“未提供”，不得推断或编造。
- `category`：`academic | arts | sports | service | technology | international | interest`。
- `timeBand`：`weekday-evening | weekend | flexible`。
- `intensity`：`low | medium | high`。
- `socialStyle`：`quiet | collaborative | expressive`。
- `skillBarrier`：`beginner | guided | experienced`；当前演示数据不强行使用 `experienced`。
- `commitment`：`casual | regular | project`。
- 这些枚举是产品原型用于筛选、匹配和解释的内部估计，不得写成社团官方承诺。

## 当前数据集基线

- `data/clubs.js` 当前包含 98 个社团。
- 静态校验要求：ID 与名称无重复，所有结构化字段类型和枚举合法。
- 当前 98 条记录没有缺失比较字段，但消费页面仍必须保留“未提供”的兼容行为。
- 98 条记录的 `dataStatus` 全部是“待社团确认”；实际信息应以本学期社团现场介绍为准。

## 003 计划：字段级 Evidence

专业版不再用对象级 `dataStatus` 代替每个字段的证据。每个参与硬约束、匹配、压力测试或报告的事实都必须绑定一条 `EvidenceRecord`；字段值和 evidence 任一缺失时，该事实按未知处理。

### `EvidenceRecord`

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `id` | string | 是 | 在本地数据集内稳定唯一的证据 ID |
| `fieldPath` | string | 是 | 被支持字段的完整路径，例如 `decisionProfile.schedule.typicalWindows` |
| `grade` | `'A' \| 'B' \| 'C' \| 'D' \| 'U'` | 是 | 证据等级 |
| `sourceType` | string | 是 | 来源类型枚举，见下方 |
| `sourceRef` | string \| null | 是 | 可定位的文档、访谈编号或 URL 描述；未知时为 `null` |
| `observedAt` | string \| null | 是 | 信息对应日期，使用 `YYYY-MM-DD`；未知时为 `null` |
| `verifiedAt` | string \| null | 是 | 最近核验日期；未核验时为 `null` |
| `expiresAt` | string \| null | 是 | 明确失效日期；无已知期限时为 `null`，不等于永久有效 |
| `note` | string | 是 | 简短说明适用范围、冲突或推断过程 |
| `hardPassEligible` | boolean | 是 | 是否允许支持硬约束 PASS；必须由下列规则计算/校验，不能任意填写 |

`sourceType` 枚举：

- `official-current`：本学期官方、可定位且字段明确的资料；
- `leader-confirmed`：当前负责人对具体字段的直接确认；
- `cross-checked`：至少两条独立可靠来源一致；
- `member-interview`：单一成员/往届成员经验；
- `public-secondary`：公开二手资料；
- `prototype-inferred`：为原型演示从名称、分类或文案推断；
- `unknown`：没有可定位来源。

等级语义：

- A：当前有效的 `official-current`，字段和适用学期明确；
- B：`leader-confirmed` 或 `cross-checked`，且时间范围明确；
- C：单一访谈或可能过时但可定位的二手资料；
- D：弱线索、未经交叉确认或仅能间接支持；
- U：未知、缺失、来源不可定位或纯占位。

### 硬约束判定资格

`hardPassEligible` 只有在以下条件全部满足时才可为 `true`：

1. `grade` 是 A 或 B；
2. `sourceType` 是 `official-current`、`leader-confirmed` 或 `cross-checked`；
3. `sourceRef`、`observedAt` 与 `verifiedAt` 均存在；
4. evidence 的 `fieldPath` 与实际判定字段完全一致；
5. 尚未超过 `expiresAt`（若有），且没有未解决的冲突证据。

**`prototype-inferred` 在任何等级标注下都不能支持硬约束 PASS。** 迁移期若旧字段由原型规则推断，应标为 D 或 U、`hardPassEligible: false`。当其值与用户要求表面相符时，硬约束结果仍必须是 `UNKNOWN`，不能降格成“弱 PASS”。明确 FAIL 是否可判定也必须使用规则声明的可否定来源；没有合格来源时仍为 UNKNOWN。

## 003 计划：`ClubDecisionProfile`

每个 Club 计划增加 `decisionProfile`。数组和数值均保存规范化机器值，展示文案由独立映射生成。

### 基本与发现字段

| 路径 | 类型 | 含义 |
|---|---|---|
| `decisionProfile.categories` | string[] | 可多选的活动分类 |
| `decisionProfile.interestTags` | string[] | 兴趣主题标签 |
| `decisionProfile.searchAliases` | string[] | 搜索别名 |
| `decisionProfile.growthGoals` | string[] | `skill \| portfolio \| service \| leadership \| friendship \| competition` |

### 计划与投入字段

| 路径 | 类型 | 含义 |
|---|---|---|
| `decisionProfile.schedule.typicalWindows` | string[] | `weekday-day \| weekday-evening \| weekend-day \| weekend-evening \| flexible` |
| `decisionProfile.schedule.fixedWindows` | string[] | 必须参加的固定时段；未知用 `null`，不能用空数组冒充“没有” |
| `decisionProfile.schedule.noticeDays` | number \| null | 通常提前通知天数 |
| `decisionProfile.commitment.weeklyHoursMin` | number \| null | 常态每周最低小时 |
| `decisionProfile.commitment.weeklyHoursMax` | number \| null | 常态每周最高小时 |
| `decisionProfile.commitment.mandatoryAttendance` | `'none' \| 'some' \| 'most' \| 'unknown'` | 强制出席程度 |
| `decisionProfile.commitment.allowedAbsences` | number \| null | 可接受缺席次数 |
| `decisionProfile.commitment.peakPeriods` | string[] \| null | 招新、赛事、演出等高峰期 |
| `decisionProfile.commitment.peakHoursMax` | number \| null | 高峰期每周最高小时 |
| `decisionProfile.commitment.duration` | `'event' \| 'term' \| 'year' \| 'flexible' \| 'unknown'` | 常见承诺周期 |

### 成本、地点与准入字段

| 路径 | 类型 | 含义 |
|---|---|---|
| `decisionProfile.cost.feeCnyMin` | number \| null | 必需费用下界 |
| `decisionProfile.cost.feeCnyMax` | number \| null | 必需费用上界 |
| `decisionProfile.cost.extraCostNote` | string \| null | 器材、交通等额外成本 |
| `decisionProfile.location.campusAreas` | string[] \| null | 常见活动区域 |
| `decisionProfile.location.offCampusRequired` | boolean \| null | 是否必须校外参与 |
| `decisionProfile.entry.skillBarrier` | `'beginner' \| 'guided' \| 'experienced' \| 'unknown'` | 入门门槛 |
| `decisionProfile.entry.selectionRequired` | boolean \| null | 是否选拔 |
| `decisionProfile.entry.deadline` | string \| null | 报名截止日；只用于提醒，不在小程序内报名 |
| `decisionProfile.entry.equipmentRequired` | string[] \| null | 必需设备 |
| `decisionProfile.accessibility.notes` | string \| null | 已确认的无障碍或参与限制；未知不得推断 |

### 软偏好字段

| 路径 | 类型 | 含义 |
|---|---|---|
| `decisionProfile.socialStyle` | string[] | `quiet \| collaborative \| expressive \| competitive` |
| `decisionProfile.activityModes` | string[] | `discussion \| practice \| project \| performance \| competition \| service` |
| `decisionProfile.structureLevel` | `'loose' \| 'balanced' \| 'structured' \| 'unknown'` | 组织结构偏正式程度 |
| `decisionProfile.autonomyLevel` | `'low' \| 'medium' \| 'high' \| 'unknown'` | 成员自主程度 |

### 字段 evidence 映射

`evidence` 为 `Record<string, EvidenceRecord[]>`，键必须是上述具体字段路径，不能只写 `decisionProfile.schedule` 这类父路径。一个字段可有多条证据；存在冲突时全部保留，并由读取器输出冲突状态，不能静默选取较有利值。

最小示意：

```text
decisionProfile.commitment.weeklyHoursMax = 6
evidence["decisionProfile.commitment.weeklyHoursMax"] = [
  {
    id: "ev-club-001-hours-2026",
    fieldPath: "decisionProfile.commitment.weeklyHoursMax",
    grade: "B",
    sourceType: "leader-confirmed",
    sourceRef: "访谈 L-012",
    observedAt: "2026-07-20",
    verifiedAt: "2026-07-20",
    expiresAt: "2027-02-01",
    note: "常态周，不含比赛前两周",
    hardPassEligible: true
  }
]
```

## 003 计划：用户决策数据

### `DecisionProfile`

- `hardConstraints`：用户明确标为不可妥协的时段、每周上限、费用上限、校外要求、技能/选拔/设备限制；每项含 `id`、操作符、目标值和来源题目。
- `softPreferences`：兴趣、时段偏好、投入偏好、互动方式、成长目标、参与方式六维；每维含答案、原始权重和归一化权重。
- 原始权重总和为 0 时使用六维等权，且记录 `usedDefaultWeights: true`。

### `HardConstraintEvaluation`

- `constraintId`、`fieldPath`、`result: PASS | FAIL | UNKNOWN`；
- `reasonCode`、人类可读 `reason`、`evidenceIds`；
- 候选总体结果：任一 FAIL 为 FAIL；否则任一 UNKNOWN 为 UNKNOWN；全部 PASS 才为 PASS。

### `PreferenceMatchResult`

- `score`：0–100 整数；
- `confidence`：0–100 整数，与 score 分开；
- `dimensions[]`：维度、归一化权重、兼容度、加权贡献、`isUnknown`、evidence IDs；
- `reasons`、`conflicts`；最多各 3 条用于摘要，完整逐维轨迹必须保留。
- 兼容度为 0、25、50、75、100；未知字段计算值为 50，但 `isUnknown` 必须为 true，证据置信按 U=0 计。

### `StressTestResult`

- `scenarioId`、`clubId`；
- `result: RESILIENT | AT_RISK | UNKNOWN`；
- `requiredFieldPaths`、`evidenceIds`、`ruleId`、`reason`；
- 必需字段缺失、冲突或仅有 `prototype-inferred` 时必须为 UNKNOWN。

### `DecisionReport`

- 会话/计算版本、生成时间、结论类型；
- 候选快照、硬约束结果、匹配和置信度、压力摘要；
- 所有未知字段和最多 5 条核实问题；
- 事实引用 evidence ID，不复制成无来源的新事实。

## 模块导出

### `getAllClubs()`

- 返回 98 条当前本地社团数组。
- 当前实现返回内部数组本身；调用方必须将返回值视为只读，不得增删或直接改写对象。

### `getClubsByIds(ids)`

- `ids` 应为社团 ID 数组；缺失值按空数组处理。
- 未知 ID 被忽略，重复 ID 只保留第一次。
- 返回顺序严格跟随输入 ID 的首次出现顺序。

### `searchClubs(query, filters)`

- 在名称、简介、分类显示名、氛围、标签和别名中进行不区分大小写的本地子串搜索。
- `filters` 支持 `category/timeBand/intensity/socialStyle/skillBarrier/commitment`；单值和数组均可。
- 多个字段之间是“且”，同字段数组内是“或”；空查询和空筛选返回全部。

### `displayField(value)`

- `null`、`undefined`、空字符串和仅空白字符串返回“未提供”。
- 其他值按当前值返回。

### `getDifferenceSummary(idsOrClubs)`

- 接受 ID 数组或 Club 数组。
- 仅返回候选之间值不完全相同的维度；每项保留字段、显示名及各社团原值，便于追溯。

### `getExpectationCards(idsOrClubs)`

- 为每个候选生成一张预期卡，概括投入、互动、门槛和时段。
- 每张卡固定携带“待社团确认”和现场确认提醒。

## 决策纯函数

- `utils/match.js`：四题固定权重评分，按分数降序、原数据顺序破同分，最多返回 6 项；每项提供 2–3 条理由和逐题计分轨迹。
- `utils/booth-questions.js`：根据缺失字段、候选差异、当前倾向或偏好生成最多 3 条现场问题；每题带来源和字段。
- 两个模块均为 CommonJS、无副作用、无网络、无依赖，不使用随机数或 LLM。
- `pages/list` 已消费 `matchClubs()` 与 `searchClubs()`：四题 Top 6 和直接搜索/分类筛选位于同一页面，并共用候选选择状态。
- `pages/compare` 已消费 `getDifferenceSummary()`：保持候选选择顺序，只高亮显示值不完全相同的比较维度。
- `pages/result` 已消费 `getExpectationCards()` 与 `generateBoothQuestions()`：倾向确认后展示中文预期卡和最多 3 条现场追问。

## 会话状态

`app.js` 当前维护：

- `selectedClubIds: string[]`：当前候选社团 ID；页面规则要求 2–3 个后才能比较。
- `preferenceAnswers: Record<string, string>`：当前四题答案，键为 `category/timeBand/intensity/socialStyle`；未回答的键可缺失。
- `recommendations: MatchResult[]`：当前 Top 6 匹配结果，供返回选择页时恢复；每项含 `club/score/reasons/trace/dataStatus`。
- `tendency: 'club:<id>' | 'none' | null`：当前倾向。

以上状态只存在当前小程序会话，不写入 Storage，不承诺关闭重开、跨设备或跨会话恢复。“重新开始”会清空四项状态。

搜索词、分类筛选和当前模式属于 `pages/list` 页面实例状态，不写入 `globalData`；普通页面返回时由页面栈保留，页面被销毁或重新启动后可以重置。

### 003 目标会话

专业版计划将上述旧四项迁移为版本化 `decisionSession`，至少包含：

- `navigation`、`assessment`、`decisionProfile`、`recommendation`；
- `library`、`clubView`、`selection`、`comparison`、`report`；
- `calculationVersion` 与 `dataVersion`。

答案变化递增计算版本并使推荐、候选匹配快照、比较和报告失效；候选变化使比较和报告失效。状态仍只在当前会话，不写 Storage。

## 变更协议

新增字段、改变必填性、改变缺失值展示、改变 ID 或排序语义时：

1. 先更新本文档和相关规格。
2. 指定 `data/clubs.js` 的单一负责人。
3. 再修改数据和消费页面。
4. 更新验证记录并人工回归。

专业版额外要求：

5. 改变 evidence 等级、硬通过资格、兼容矩阵、题目依赖或压力规则时，同步更新 003 规格、ADR 和规则测试。
6. 不得通过批量脚本把旧 `dataStatus: 待社团确认` 自动升级为 A/B 证据。
7. 来源冲突必须保留和暴露；只有新的可定位证据才能提升等级或解除 UNKNOWN。
