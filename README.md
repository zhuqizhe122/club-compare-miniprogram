# club-compare-miniprogram

Session 5 walking skeleton：**加入前先比一比**（本地样例社团对照卡）。  
协作基线：见根目录 `AGENTS.md`（规则、非目标、spec-update protocol、Git 习惯）。

## Open in WeChat DevTools

1. 导入本仓库根目录（含 `project.config.json` / `app.json` 的这一层）。
2. 使用测试号即可；无需后端、登录或网络。

## Flow

- 直接比较：`pages/index` → `list`（勾选 2–3）→ `compare`（四维对照）→ `result`
- 倾向测试：`pages/index` → `quiz`（8 道题）→ `quiz-result`（推荐 3 个）→ `compare` → `result`

## Project context

- 项目方向：`master-plan.md`
- 直接比较规格与验证：`specs/001-club-compare-flow/`
- 倾向测试规格与验证：`specs/002-club-fit-quiz/`
- 社团数据契约：`docs/data-contract.md`
- 协作模板：`docs/issue-template.md` · `docs/pr-template.md`
- 验证记录：`validation-checklist.md` · `fix-log.md`

## Non-goals

无账号、无云同步、无 AI、无站内扫码/加群。详见 `AGENTS.md`。
