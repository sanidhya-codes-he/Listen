# [S3-06] Roll-up and purge

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S3-03, S3-04 |
| Labels | stage-3, agent |
| Spec | §5.3 |
| Status | todo |

## Goal
Raw sessions are summarised into daily totals every hour, and private data older than 30 days is
deleted, without losing anything that has not been summarised.

## Scope
- roll-up every hour: `app_sessions` -> `usage_daily` (per date, app, site); idempotent (running it
  twice changes nothing)
- purge at start-up and every 6 h: **roll up first**, then delete `continuous_log` and
  `app_sessions` older than 30 days; `meta.last_rollup`, `meta.last_purge`
- `commands` and `usage_daily` are never purged (owner deletes them; tombstones in S4)
- tests with the fake clock across midnight and across 30 days

## Done when
- [ ] a session crossing midnight is split between the two dates
- [ ] purge never deletes a session that was not rolled up (test)

## How to test
`cd agent; uv run pytest -k "rollup or purge" -v`

## Learning
Idempotent jobs; ordering for safety (roll up, then delete); time-zone and midnight edge cases.
