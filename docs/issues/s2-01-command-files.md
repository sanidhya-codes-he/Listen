# [S2-01] Command files and the recipe schema

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | M2 |
| Labels | stage-2, agent |
| Spec | §3.1, §3.5 (primitive names), §3.8 (routines format), Doc 03 |
| Status | todo |

## Goal
Commands live in YAML files in `commands/`, every entry is checked against one schema, and
`listen commands check` reports problems with file and line.

## Why
Commands are data, not code (Doc 03): adding "open spotify" must never need a Python change. One
schema (`shared/recipe.schema.json`) is the single definition of a valid command, later reused by
the server and the web form.

## Scope
- `shared/recipe.schema.json` (JSON Schema): `targets` (name -> per-verb URLs, `home`), `defaults`
  (verb -> target), `commands` (id, patterns, action + params **or** `steps`, optional `when_app`,
  `focus_first`, `risk: low|high`, `continuous: allow|confirm|block`, `undo: {keys: ...}`)
- `listen_agent/intent/library.py`: load every `commands/*.yaml` with `load_yaml` (M2); validate each
  entry; **skip invalid entries with a warning naming file and line**; if a whole file cannot be
  parsed, keep the last good version of that file; return one `CommandLibrary` object
- hot reload: a `reload_if_changed()` that compares the folder's modification times (called every
  2 s by the housekeeping worker in S2-16)
- `listen commands check`: validate all files, print problems, exit non-zero if any
- starter files: `core.yaml` (open, search, close, volume, play), `browser.yaml` (targets: google,
  youtube, github ...), `terminal.yaml`, `media.yaml`, `routines.yaml` (the owner's "dsa" routine)
- new dependency: `jsonschema`

## Out of scope
Matching sentences (S2-02); running actions (S2-04..06); `browser`/`profile` in routine steps (S6-02).

## Done when
- [ ] a broken entry is skipped with `commands/core.yaml:14: ...`, the other entries still load
- [ ] an unparseable file keeps its last good version in memory
- [ ] `listen commands check` exits 0 on the starter files, non-zero on a broken copy
- [ ] tests: valid file, each kind of invalid entry, unparseable file, reload on change
- [ ] every primitive name in the schema matches the allowlist in §3.5

## How to test
```
agent/.venv/Scripts/python -m pytest agent -k library -v
agent/.venv/Scripts/listen commands check
```

## Open decisions
- `pyyaml` reports line numbers only through its node API: use the loader's marks, or accept
  "entry #N" instead of a line number?
- JSON Schema draft version (2020-12 is current).

## Learning
JSON Schema; validating data at the edge; "skip the bad, keep the good"; mtime-based reloading.
