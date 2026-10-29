# [S4] Stage 4: server and sync

| | |
|---|---|
| Kind | stage issue (milestone "Stage 4: server and sync") |
| Depends on | S1 (server tasks); S3 (sync client) |
| Labels | stage-4 |
| Spec | §6 (sync), §7 (server), §9.5 (server CI job) |
| Status | todo |

## Goal
A FastAPI + PostgreSQL server with login, devices, the sync endpoint and analytics, and an agent that
syncs every 5 minutes without losing data or leaking private tables.

## Tasks (sub-issues)
S4-01 scaffolding + CI job -> S4-02 database -> S4-03 auth -> S4-04 devices -> S4-05 sync endpoint
-> S4-06 sync client -> S4-07 snapshots and pending edits; S4-08 analytics -> S4-09 Doc 13

## Done when
- [ ] all task issues closed
- [ ] laptop offline for a day, then online: every row arrives exactly once
- [ ] a device token revoked on the server stops sync with a pop-up
- [ ] privacy test: sync never reads `continuous_log` or `app_sessions`
- [ ] interactive API docs at `/docs`; CI `server` job green against PostgreSQL 16
