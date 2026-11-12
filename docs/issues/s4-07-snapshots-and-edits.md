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
(updated 2026-11-12 after S2-01 merged (PR #85): the files, schema and validator that exist, and
what "validate" can and cannot do)

- laptop -> server: a snapshot of all command files (with a hash, primitive list, app names) only
  when the hash changed; stored in `command_snapshots`. The files are `commands/*.yaml` (read by
  `intent/library.py`, `CommandFiles`); the primitive list is `list_primitives()` (S2-04) and equals
  the schema's `action` enum. Hash the **file contents**: `CommandFiles` itself only compares
  mtime and size to notice a change, which is no basis for "unchanged since that snapshot". Include
  `library.problems`, so the web app can show why an entry is missing.
- server: `GET /v1/library`, `POST /v1/library/edits`, `GET /v1/library/edits`
- server -> laptop: pending edits carrying the snapshot hash they were based on
- laptop applies each: target unchanged since that snapshot -> write it with **`ruamel.yaml`**
  (comments and layout kept; a new dependency, check its current version on PyPI when you start),
  validate, report `applied`; invalid -> revert, report `invalid` with
  the reason; changed locally -> report `overridden` (laptop wins)
  - **validate = the S2-01 schema** (`shared/recipe.schema.json`, also used by the web form).
    `CommandFiles` never fails on a bad entry, it skips it and adds a line to `library.problems`
    (`core.yaml:14: command 'x': ...`), so "invalid" means: load the written file and find a problem
    for it (or none, then `applied`). Do that on a copy first (`CommandFiles(folder)` takes any
    folder), then replace the real file, so a bad edit is never on disk (see "Done when").
    The problem line is the `reason` to report.
  - the laptop's own write changes mtime, so the next `reload_if_changed()` picks it up; no extra
    call is needed
  - the read side (PyYAML, strict: refuses duplicate keys) and the write side (ruamel) are two
    parsers; test that a file ruamel writes is read back by `load_yaml` with the same commands
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
