# [S4-05] The sync endpoint

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-04 |
| Labels | stage-4, server |
| Spec | §6.1, §6.2, §6.3, §6.5, Doc 06 |
| Status | todo |

## Goal
`POST /v1/sync` accepts rows and deletions from the laptop, never duplicates or resurrects anything,
and returns what changed on the server since the laptop's cursor.

## Scope
- request: `cursor`, `rows` (up to 500), `deletions` (uuids), optional `commands_snapshot`,
  `edit_results`; reply: `accepted` uuids, `deletions`, `pending_edits`, new `cursor`
- **upsert by uuid** (idempotent: sending the same batch twice changes nothing)
- a row that fails validation -> rejected individually (422 detail), the rest of the batch continues
- deletions: delete content at once, keep a **uuid-only tombstone forever**, refuse any later upload
  of that uuid
- `change_log` numbers every server-side change; the cursor is that number, never a laptop clock

## Done when
- [ ] tests: idempotent replay, tombstone blocks resurrection, mixed valid and invalid rows,
      cursor returns only newer changes, batch of 500
- [ ] only the device token works here (session cookie -> 401)

## How to test
`cd server; uv run pytest -k sync -v`

## Learning
Idempotency; upserts; tombstones; ordering by a server counter instead of clocks.
