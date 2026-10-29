# [S4-02] Server database: models and migrations

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-01 |
| Labels | stage-4, server |
| Spec | §7.2, Doc 07 (ORM) |
| Status | todo |

## Goal
All server tables exist in PostgreSQL, created by Alembic migrations from SQLAlchemy 2.0 models.

## Scope
- models (`Mapped`, `mapped_column`): `users`, `sessions`, `devices`, `failed_logins`, `commands`
  (laptop columns + `device_id`, `received_at`), `usage_daily`, `tombstones`, `change_log`,
  `command_snapshots` (`jsonb`), `pending_edits`
- every data table has `user_id`; a helper makes "filter by the caller's user" the default
- Alembic: the first migration; `alembic upgrade head` runs in tests on a fresh database
- test fixtures: a fresh database per test session, transactions rolled back per test

## Done when
- [ ] migration up and down both work on a fresh database
- [ ] a test proves a query for user A never returns user B's rows

## How to test
`cd server; uv run pytest -k "models or migrations" -v`

## Learning
ORMs and sessions; migrations on a shared database; multi-user safety from day one.
