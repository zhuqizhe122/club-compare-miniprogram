# 社团数据契约

> 2026-07-24 更新：资料库支持**分类筛选**与**搜索**；分类可由运行时推断，亦可选写入 `category`。

## Club 对象

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `id` | string | 是 | 唯一稳定 ID |
| `name` | string | 是 | 名称 |
| `tagline` | string | 是 | 简介 |
| `weeklyHours` | string | 否 | 每周时间 |
| `frequency` | string | 否 | 活动频率 |
| `memberRole` | string | 否 | 普通成员职责 |
| `vibe` | string | 否 | 氛围 |
| `images` | string[] | 否 | 本地图片路径；空则详情页显示图片占位 |
| `honors` | string \| string[] | 否 | 荣誉/成果介绍；空则详情页显示荣誉占位 |
| `category` | string | 否 | 分类 id（见下表）；缺省时由 `utils/categories.js` 推断 |

### 分类枚举（v1）

| id | 展示名 |
|----|--------|
| `theory` | 理论学术 |
| `sport` | 体育运动 |
| `arts` | 文艺实践 |
| `service` | 公益服务 |
| `culture` | 文化交流 |
| `tech` | 科技实践 |
| `other` | 其他兴趣 |

- 缺失比较字段经 `displayField()` →「未提供」  
- **不要求** Club 上持久化 `tags`；匹配由 `utils/infer-tags.js` 推断  

## 模块导出

- `getAllClubs()`  
- `getClubById(id)`  
- `getClubsByIds(ids)` — **保持输入 ID 顺序**  
- `displayField(value)`  

## 资料库交互

- 支持按分类筛选（含「全部」）  
- 支持按名称 / 简介关键字搜索（本地，大小写不敏感）  
- 分类与搜索可组合  

## 会话状态（app.js）

| 字段 | 含义 |
|------|------|
| `quizAnswers` | 问卷答案 |
| `recommendation` | `{ clubIds, items }` |
| `basketIds` | 比较篮，**最多 4** |
| `tendency` | 可选 |

## 变更协议

改字段/语义：先改本文档与规格，再改数据与页面。
