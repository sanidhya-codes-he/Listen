# [S2-03] App index from the Start Menu

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S1 |
| Labels | stage-2, agent |
| Spec | §3.4 |
| Status | in progress |

## Goal
Listen knows every installed app by its display name, so "open vs code" finds "Visual Studio Code".

## Why
The `{app}` slot needs a list of real apps and a tolerant way to match spoken names to them.

## Scope
(updated 2026-11-04 before starting: decision made with measurements; wiring moved to S2-16)
- `intent/app_index.py`: scan the two Start Menu folders (current user, then all users) for `.lnk`
  shortcuts -> display name (the file name) -> shortcut path and launch target (the `.exe`)
- the target is needed because undoing "open X" closes the exact program Listen started (§3.9);
  read with **pywin32** (new dependency, Windows only): 125 shortcuts in 0.50 s on the owner's
  laptop, against 3.6 s through a PowerShell call
- skip uninstallers (name contains "uninstall") and broken links (target set but missing); keep
  shortcuts with no target (store apps: 3 of 125), launched through the shortcut itself
- the same name twice: the first found wins (current user before all users)
- aliases given by the caller (e.g. `vs code` -> `Visual Studio Code`); the command files that hold
  them arrive in S2-01
- fuzzy lookup with `difflib` similarity, threshold **0.8**; returns `(app, similarity)` so the
  matcher can use it as match confidence; exact names and aliases score 1.0
- `rebuild()` rescans; calling it at start-up, daily and on "refresh apps" is wiring (S2-16)
- tests run against a **fake folder** in `tmp_path` and a fake target reader (never the real Start
  Menu); one manual run against the real Start Menu, recorded in the PR

## Out of scope
Launching apps (S2-04); per-app volume (S2-05).

## Done when
- [x] lookup finds exact names, aliases, and close misspellings over 0.8; refuses below
- [x] the scan skips uninstaller shortcuts and broken links
- [x] tests use only `tmp_path` folders

## How to test
```
cd agent
uv run pytest -k app_index -v
```

## Decisions (made 2026-11-04)
- Reading shortcut targets: **pywin32** (`win32com`), measured 7x faster than PowerShell. The target
  is used to find an app's windows (focus, close). Launching goes through the shortcut itself with
  `ShellExecuteExW` (S2-04), which keeps its arguments and "Start in" folder and still returns a
  process id for undo (confirmed in S2-04's manual check, PR #80).
- (review of PR #79, fixed in a follow-up PR) the 0.8 line is tested from both sides ("visual
  code" 0.76 and "chrome" 0.63 are refused), aliases are cleaned like spoken names, and the real
  shortcut reader has a test; short names like "chrome" come from S2-01's aliases.

## Learning
Windows shortcuts; string similarity (`difflib.SequenceMatcher`); testing file-system code with
temporary folders.
