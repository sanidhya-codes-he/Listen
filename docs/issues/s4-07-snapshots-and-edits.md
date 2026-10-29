# [S4-07] Command snapshots and pending edits

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-06, S2-01 |
| Labels | stage-4, agent, server |
| Spec | §6.4, §7.1 (library endpoints) |
| Status | todo |

## Goal
The web app can see the laptop's commands and propose edits; the laptop, which stays the master,
applies them safely or explains why not.

## Scope
- laptop -> server: a snapshot of all command files (with a hash, primitive list, app names) only
  when the hash changed; stored in `command_snapshots`
- server: `GET /v1/library`, `POST /v1/library/edits`, `GET /v1/library/edits`
- server -> laptop: pending edits carrying the snapshot hash they were based on
- laptop applies each: target unchanged since that snapshot -> write it with **`ruamel.yaml`**
  (comments and layout kept), validate, report `applied`; invalid -> revert, report `invalid` with
  the reason; changed locally -> report `overridden` (laptop wins)
- statuses on the server: waiting for laptop / applied / invalid / overridden

## Done when
- [ ] tests for each status, including "comments survive an applied edit"
- [ ] a bad edit never leaves a broken command file on disk

## How to test
```
cd agent;  uv run pytest -k "snapshot or pending" -v
cd server; uv run pytest -k library -v
```

## Learning
Single source of truth; optimistic concurrency with a base hash; editing YAML without losing comments.
