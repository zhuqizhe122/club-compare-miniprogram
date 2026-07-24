# 社团数据契约

> 本契约描述 `data/clubs.js` 的本地演示数据和纯函数接口。社团名称沿用已有名单；除名称外的文案和结构化字段均不是官方资料，统一标记“待社团确认”。

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

## 变更协议

新增字段、改变必填性、改变缺失值展示、改变 ID 或排序语义时：

1. 先更新本文档和相关规格。
2. 指定 `data/clubs.js` 的单一负责人。
3. 再修改数据和消费页面。
4. 更新验证记录并人工回归。
