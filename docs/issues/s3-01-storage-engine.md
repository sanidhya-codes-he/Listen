# [S3-01] Storage engine: SQLite, migrations and recovery

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S2-08 |
| Labels | stage-3, agent |
| Spec | §5 (intro), §9.1 (database busy, disk full, damaged) |
| Status | todo |

## Goal
One storage worker is the **only** writer of `%APPDATA%\Listen\listen.db`, applies migrations at
start, survives a busy or damaged database, and never blocks a voice command.

## Why
Many threads want to save things; SQLite allows one writer at a time. One writer thread with a queue
avoids "database is locked" errors by design, and WAL mode lets readers work while it writes.

## Scope
- storage worker: receives write requests on its inbox, batches them every second in one small
  transaction
- WAL mode; 5 s busy timeout; all times stored in UTC
- migrations: plain SQL files `storage/migrations/NNN_*.sql`, applied in order from
  `meta.schema_version`
- integrity check at start; a damaged file is **renamed** (kept) and a fresh one created, with a
  pop-up; disk full -> keep running commands, warn that saving paused
- tests: temp-file databases (`tmp_path`), never the real one

## Out of scope
The actual tables (S3-02).

## Done when
- [ ] migrations apply once and are skipped next time; a test proves order and idempotence
- [ ] damaged-file recovery test (write garbage into a temp db, start, check the rename)
- [ ] a write burst of 1,000 rows does not delay a published voice event (measured in a test)

## How to test
`cd agent; uv run pytest -k storage -v`

## Learning
SQLite, transactions, WAL; schema migrations; the single-writer pattern.
