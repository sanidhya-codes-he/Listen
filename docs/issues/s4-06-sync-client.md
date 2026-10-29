# [S4-06] Sync client on the laptop

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-05, S3-06 |
| Labels | stage-4, agent |
| Spec | §6.1, §6.2, §6.3, §6.5, §9.1 (offline, 401, 422) |
| Status | todo |

## Goal
Every 5 minutes (and right after the network comes back) the laptop uploads its new and changed rows
and downloads server changes, and nothing is ever lost while offline.

## Scope
- sync worker: outbox = rows where `synced_at` is empty or `updated_at > synced_at`; batches of 500,
  continue at once while a backlog remains; `synced_at` set **only** for `accepted` uuids
- back-off on failure: 5, 10, 20, then 30 minutes; one success resets to 5; 60 s timeout (free
  server may be asleep)
- immediate sync when Windows reports the network is back
- 401 -> stop syncing, pop-up asking for a new token; 422 rows -> logged and set aside
- deletions: local rows with `deleted_at` are removed once the server confirms; server deletions
  remove the local copy; `meta.sync_cursor`
- **the privacy test**: sync reads only the syncable tables listed in S3-02 (fails if any other
  table is touched)
- tests against a **fake server** (no network)

## Done when
- [ ] tests: offline backlog, back-off sequence (fake clock), 401 stop, 422 set aside, tombstones,
      privacy test
- [ ] manual: a day offline, then online -> every row arrives once

## How to test
`cd agent; uv run pytest -k sync -v`

## Open decisions
- HTTP client library: `httpx` (sync API, timeouts) is the usual choice.

## Learning
The outbox pattern; exponential back-off; testing network code with a fake server.
