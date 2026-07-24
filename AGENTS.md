# AGENTS.md — club-compare-miniprogram

Standing instructions for any coding agent. Read before changing files.

## Docs before code

Behaviour / feature changes: update `master-plan.md`, `docs/data-contract.md`, and active spec under `specs/` **first**, then code.

## Project goal

Local-first WeChat Mini Program with **two parts**:

1. **全部社团资料** — browse full local club catalog + detail  
2. **问卷推荐** — ≥10-question quiz → rule recommendations (reason + intro) → pick **≤4** to compare → optional detail → suggested questions  

No in-app 加群. No live LLM.

## Stack

| Item | Choice |
|------|--------|
| Runtime | WeChat Mini Program |
| Data | `data/clubs.js` + session `globalData` |
| Matching | `utils/match.js` + inferred tags |
| Backend / AI / auth | None |

## Flow

**Part 1:** `index` → `library` → `club`  

**Part 2:** `index` → `quiz` → `recommend` → (`compare` \| `club`) → `result`

## Non-goals

Login, cloud sync, live LLM, in-app QR/加群, npm bloat.

## Spec-update protocol

1. Bug → fix + `fix-log.md`  
2. Intended behaviour change → docs first, then code  
3. New value → Issue / backlog unless folded in  
4. Stack / data contract → update contract + master-plan first  

## Git

No commit until human confirms `git diff`. No force-push unless asked.
