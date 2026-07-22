# 002 — 实现计划

## 数据和评分

- `data/quiz.js`：8 道题、选项、维度标签和 98 个社团的兴趣领域映射。
- `utils/quiz.js`：答案校验、社团特征生成、固定评分、稳定排序和推荐理由。
- `tests/quiz.test.js`：使用 Node 内置 `assert` 验证数据覆盖和确定性，不增加测试依赖。

## 页面

- `pages/quiz`：逐题作答、进度、上一题和下一题。
- `pages/quiz-result`：展示 3 个结果、理由、进入比较和重新测试。
- `pages/index`：增加测试入口，同时保留直接比较。

## 会话状态

`app.globalData.quizRecommendations` 暂存本轮结果；重新开始或重新测试时清空。答案只保存在测试页面实例中。

## 集成

结果页把推荐 ID 写入已有 `selectedClubIds`，然后进入 `pages/compare`。比较页和最终结果页不需要理解测试评分规则。
