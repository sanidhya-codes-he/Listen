# [S2-21] A damaged shortcut must not stop the app index

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-03 |
| Labels | stage-2, agent |
| Spec | §3.4, §4.7 |
| Status | todo |

## Goal
One unreadable `.lnk` in the Start Menu is skipped with a warning; every other app is still indexed.

## Why
Raised in the review of PR #79 ("declined to judge"): `read_targets` asks Windows to open every
shortcut in one go, and if one file is damaged (a half-written install, a corrupt disk sector) the
error ends the whole `rebuild()`. S2-16 calls `rebuild()` at start-up, so one bad file anywhere in
the Start Menu would stop Listen from starting.

## Scope
- first, a test that shows what really happens: a `.lnk` made of garbage bytes, read with the real
  reader (`win32com`), next to a good one
- `read_targets` reads each shortcut on its own: a damaged one gives "" (no target) or is left
  out, and a warning names the file (an app's file name, not spoken words, so it may be logged)
- `rebuild()` keeps every readable app

## Out of scope
When `rebuild()` runs (S2-16).

## Done when
- [ ] the garbage-bytes test fails before the fix and passes after
- [ ] a damaged shortcut gives one warning in the log and no crash
- [ ] the full suite and ruff pass

## How to test
```
cd agent
uv run pytest tests/intent -v
```

## Learning
Failing one item without failing the batch; testing with deliberately broken files.
