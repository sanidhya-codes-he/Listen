# [S2-20] Store apps in the app index

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-03 |
| Labels | stage-2, agent |
| Spec | §3.4 |
| Status | todo |

## Goal
"Open Notepad" and "open Calculator" work: Windows 11's built-in store apps are in the app index.

## Why
Found in S2-03's manual run (PR #79): the index reads Start Menu shortcuts, and store apps have
none there, so "notepad" is not found. On Windows 11 that includes Notepad, Calculator, Paint,
Settings and the Photos app, the apps people ask for most.

## Scope
- read the store apps' names and their **AppUserModelID** (the id Windows starts them by), from the
  shell's "Applications" folder (`shell:AppsFolder`)
- add them to `AppIndex` next to the shortcut apps; a shortcut app with the same name still wins
  (the scan order of S2-03: current user, all users, then store apps)
- `launch_app` starts a store app through `shell:AppsFolder\<AppUserModelID>` with the same
  `ShellExecuteExW` call S2-04 uses; there may be no process id (S2-04 already returns None then)
- `App` gains what a store app needs (its id) without breaking S2-03's and S2-04's tests
- tests with a fake reader, like S2-03's; one test reads the real folder (CI runs on Windows)

## Out of scope
Finding a store app's windows for focus and close (its window belongs to another program, as S2-04
found with Notepad): a follow-up if it is needed. Wiring the index into the voice path (S2-16).

## Done when
- [ ] "notepad" and "calculator" are found on the owner's laptop, and launched by a manual check
- [ ] a shortcut app still wins over a store app with the same name (tested)
- [ ] the full suite and ruff pass

## How to test
```
cd agent
uv run pytest tests/intent -v
```

## Open decisions
- How to read the folder: pywin32's shell interfaces (already a dependency since S2-03), or
  PowerShell's `Get-StartApps` (simple, but S2-03 measured PowerShell at about 3.6 s for a
  similar job). Measure both on the owner's laptop before choosing.

## Learning
AppUserModelIDs and how Windows starts store apps; reading a shell folder.
