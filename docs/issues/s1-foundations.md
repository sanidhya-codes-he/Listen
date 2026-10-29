# [S1] Stage 1: foundations

| | |
|---|---|
| Kind | stage issue (milestone "Stage 1: foundations") |
| Depends on | nothing |
| Labels | stage-1 |
| Spec | §10 stage 1; §4.1, §4.3, §4.7, §4.8, §9.2, §9.5, §11 |
| Status | **done**: PR #1, plus two docs commits on `main` (cheat sheet, Doc 10 rewrite) |

## Goal
The plumbing every later module uses: package and `listen` CLI, settings, logging, events, event
bus, worker loop, supervisor, terminal shell, CI.

## What was delivered
- `agent/` package, `pyproject.toml`, `listen --version`, `listen run`
- `settings.yaml` with strict validation (typos, wrong types, BOM, other encodings)
- rotating log, spoken words hidden by default (`words()`)
- frozen UTC events; thread-safe publish/subscribe bus (MRO delivery, no duplicates)
- `Worker` loop (inbox, heartbeat, errors become `ModuleError`, no error storm)
- `Supervisor` (restart dead threads max 3 a minute, hang after 30 s, sleep is not a hang)
- CI: ruff + pytest on `windows-latest`; 71 tests
- plan `docs/plans/2026-10-21-stage-1-foundations.md`; Doc 10; `docs/cheatsheet.md`

## Follow-ups (from the review)
M1 pin dev tools, M2 duplicate YAML keys, M3 exit-code clash, M4 bus test, M5 run_agent tests,
M6 README line.

## How to record it
Create this issue and close it straight away, as history:
```
gh issue create --title "[S1] Stage 1: foundations" --body-file docs/issues/s1-foundations.md --label stage-1
gh issue close <number> --comment "Done in #1."
```
