# AGENTS.md — club-compare-miniprogram

Standing instructions for any coding agent working in this repo. Read before changing files.

## Project goal

Local-first WeChat Mini Program prototype: **自适应社团决策实验室** — help a first-year student separate hard constraints from preferences, narrow candidates with 8–14 deterministic questions, inspect field-level evidence, compare 2–3 clubs under pressure scenarios, and produce a non-binding report. Real join happens offline; this app does not complete 加群.

`001` and `002` are runnable checkpoint baselines, not the target information architecture. `003-adaptive-decision-lab` is the approved evolution plan; do not claim it is implemented until its tasks and manual acceptance have evidence.

## Current stack

| Item | Choice |
|------|--------|
| Preview target | WeChat Mini Program (WeChat DevTools) |
| Fallback | Plain H5 with the same flow only if DevTools is blocked |
| Data & persistence | Local sample data in `data/clubs.js`; in-session `globalData` only |
| Backend | None |
| AI / auth / payments | None |

## Spec & plan locations

- Project direction: `master-plan.md`
- Checkpoint flow: `specs/001-club-compare-flow/` and `specs/002-preference-triage/`
- Target professional flow: `specs/003-adaptive-decision-lab/`
- Data interface: `docs/data-contract.md`
- Architecture decision: `docs/adr-003-adaptive-decision-lab.md`
- Validation trail: `validation-checklist.md`, `fix-log.md`
- Collaboration templates: `docs/issue-template.md`, `docs/pr-template.md`

Before behavioural changes, read the relevant in-repo spec and remaining backlog. Before data-model changes, read and update the data contract.

## Approved target flow

`pages/index` → `pages/assessment` → `pages/recommend` → `pages/library` → `pages/club` → `pages/selection` → `pages/compare` → `pages/result`

Each page has one responsibility as defined by 003. Do not add a ninth product page. During migration, the old `pages/list` may remain only as a checkpoint compatibility route; remove it from the final target registration.

## Non-goals (do not add unless an ADR / master-plan update approves)

- Login, cloud sync, remote club DB, backend APIs  
- AI/LLM recommend, probabilistic personality labels, or training user profiles
- In-app QR / 加群 / 报名  
- New npm dependencies, payment, analytics  
- Unrelated template pages
- Treating prototype-inferred data, match scores, or stress tests as official facts

## Spec-update protocol

1. **Classify the change** against 001/002 checkpoint or 003 target; never silently rewrite checkpoint history.
2. **Bug** (fails an approved acceptance criterion) → fix code; update `fix-log.md`; re-run affected checks; spec stays unchanged unless the intended criterion itself is wrong.
3. **Target behaviour change** → update `specs/003-adaptive-decision-lab/spec.md` and acceptance first, then `plan.md`/`tasks.md`, code, tests, and manual checklist.
4. **Data/evidence change** → update `docs/data-contract.md` first. Any change to evidence grades, hard-PASS eligibility, score formula, adaptive stop rule, approved routes, persistence, network, or dependency policy also requires ADR review.
5. **New value outside 003** → backlog/Issue only unless the human explicitly folds it in; no speculative implementation.
6. **Implementation status** → check off 003 tasks only with code/test evidence; check manual items only after actual WeChat DevTools execution. Documentation plans are not completion evidence.
7. **Checkpoint compatibility** → keep 001/002 assertions until the migration task explicitly replaces them; describe deliberate incompatibility before changing code.

After any behaviour change, say explicitly: files changed · behaviour changed · how to test · spec / Milestones impact.

## Git rule

- Prefer small, reviewable diffs.  
- Do not commit until the human confirms after reviewing `git diff`.  
- No `git reset --hard`, `clean -fd`, or `push --force` unless the human explicitly asks.  
- Never commit secrets (`.env`, private keys). `project.private.config.json` stays gitignored.

## Validation rule

“Done” means a human can walk the flow in WeChat DevTools (or H5 fallback). Update `validation-checklist.md` / `fix-log.md` when fixing regressions.

For 003, “Done” additionally requires exact eight-page routing, deterministic 8–14 questions, hard-constraint PASS/FAIL/UNKNOWN, independently displayed 0–100 preference match and evidence confidence, field-level A–D/U evidence, 2–3 candidate stress comparison, and a traceable result report. `prototype-inferred` must never produce hard PASS.

## Safe command stance (for the human approving tools)

- **Safe**: read-only (`git status`, `git diff`, `git log`, list/read files).  
- **Cautious**: edit files, commit after confirmation, push.  
- **Dangerous / default no**: `rm -rf`, force-push, rewrite shared history, expose secrets.
