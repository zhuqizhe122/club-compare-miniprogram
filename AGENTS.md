# AGENTS.md — club-compare-miniprogram

Standing instructions for any coding agent working in this repo. Read before changing files.

## Project goal

Local-first WeChat Mini Program prototype: **加入前先比一比** — let a first-year student pick 2–3 sample clubs, compare four fixed dimensions, then mark a preference or「先都不加」. Real join happens offline; this app does not complete 加群.

## Current stack

| Item | Choice |
|------|--------|
| Preview target | WeChat Mini Program (WeChat DevTools) |
| Fallback | Plain H5 with the same flow only if DevTools is blocked |
| Data & persistence | Local sample data in `data/clubs.js`; in-session `globalData` only |
| Backend | None |
| AI / auth / payments | None |

## Spec & plan locations

- In-repo Session 5 trail: `validation-checklist.md`, `fix-log.md`, `README.md`
- Course workspace (sibling folder, may not be in this git remote):  
  `../project/master-plan.md`  
  `../project/specs/001-club-compare-flow/` (spec, plan, tasks, remaining-backlog)

Before behavioural changes, read the relevant spec (or this file’s Non-goals + Flow) and the remaining backlog.

## Flow (do not invent extra screens)

`pages/index` → `pages/list` → `pages/compare` → `pages/result`

## Non-goals (do not add unless an ADR / master-plan update approves)

- Login, cloud sync, remote club DB, backend APIs  
- AI recommend / live LLM calls  
- In-app QR / 加群 / 报名  
- New npm dependencies, payment, analytics  
- Unrelated template pages

## Spec-update protocol

1. **Bug** (fails existing acceptance criteria) → fix code; update `fix-log.md`; re-run checklist items; **spec unchanged**.  
2. **Intended behaviour wrong/incomplete** → **update spec first** (and acceptance criteria), then code, then checklist.  
3. **New value** (new slice) → add to backlog / GitHub Issue; **do not build in the current window** unless the human explicitly folds it in.  
4. **Touches stack, data model, or breaks a prior slice** → stop; escalate to master-plan / ADR before coding.

After any behaviour change, say explicitly: files changed · behaviour changed · how to test · spec / Milestones impact.

## Git rule

- Prefer small, reviewable diffs.  
- Do not commit until the human confirms after reviewing `git diff`.  
- No `git reset --hard`, `clean -fd`, or `push --force` unless the human explicitly asks.  
- Never commit secrets (`.env`, private keys). `project.private.config.json` stays gitignored.

## Validation rule

“Done” means a human can walk the flow in WeChat DevTools (or H5 fallback). Update `validation-checklist.md` / `fix-log.md` when fixing regressions.

## Safe command stance (for the human approving tools)

- **Safe**: read-only (`git status`, `git diff`, `git log`, list/read files).  
- **Cautious**: edit files, commit after confirmation, push.  
- **Dangerous / default no**: `rm -rf`, force-push, rewrite shared history, expose secrets.
