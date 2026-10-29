# [S2-03] App index from the Start Menu

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S1 |
| Labels | stage-2, agent |
| Spec | §3.4 |
| Status | todo |

## Goal
Listen knows every installed app by its display name, so "open vs code" finds "Visual Studio Code".

## Why
The `{app}` slot needs a list of real apps and a tolerant way to match spoken names to them.

## Scope
- `intent/app_index.py`: scan the two Start Menu folders (all users and current user) for `.lnk`
  shortcuts -> display name -> launch target
- aliases from the command files (e.g. `vs code` -> `Visual Studio Code`)
- fuzzy lookup with `difflib` similarity, threshold **0.8** (a setting); returns
  `(app, similarity)` so the matcher can use it as match confidence
- rebuilt at start-up, daily, and on the command "refresh apps"
- tests run against a **fake folder** in `tmp_path` (never the real Start Menu)

## Out of scope
Launching apps (S2-04); per-app volume (S2-05).

## Done when
- [ ] lookup finds exact names, aliases, and close misspellings over 0.8; refuses below
- [ ] the scan skips uninstaller shortcuts and broken links
- [ ] tests use only `tmp_path` folders

## How to test
`agent/.venv/Scripts/python -m pytest agent -k app_index -v`

## Open decisions
- Reading the target of a `.lnk` file: `pywin32` (`win32com`) or only the shortcut's own path
  (launch the `.lnk` itself)?

## Learning
Windows shortcuts; string similarity (`difflib.SequenceMatcher`); testing file-system code with
temporary folders.
