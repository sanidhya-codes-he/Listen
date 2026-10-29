# [S3-02] The local tables

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S3-01 |
| Labels | stage-3, agent |
| Spec | §5.1, §5.2 |
| Status | todo |

## Goal
Migration `001` creates the five tables from §5.1 with their indexes, and small functions read and
write them.

## Scope
- `001_initial.sql`: `commands`, `usage_daily` (syncable, with `uuid`, `user_id`, `synced_at`,
  `updated_at`, `deleted_at` where listed), `continuous_log`, `app_sessions` (private), `meta`
- allowed values enforced with `CHECK` constraints (`mode`, `result`, `verdict`, `verdict_source`)
- indexes on `commands.ts`, `commands.synced_at` and the purge time columns
- `storage/repo.py`: small, typed functions per table (no ORM on the laptop)
- a module constant listing which tables are **syncable** (used by the privacy test in S4-06)

## Done when
- [ ] schema test: every column from §5.1 exists with the right type
- [ ] invalid values are rejected by the database itself (tests)

## How to test
`cd agent; uv run pytest -k "tables or repo" -v`

## Learning
Designing tables from requirements; `CHECK` constraints; indexes and why they speed up reads.
