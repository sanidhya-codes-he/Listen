# [S2-20] Store apps in the app index

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-03 |
| Labels | stage-2, agent |
| Spec | §3.4 |
| Status | in progress |

## Goal
"Open Notepad" and "open Calculator" work: Windows 11's built-in store apps are in the app index,
and a damaged shortcut file is no longer indexed as an app.

## Why
Found in S2-03's manual run (PR #79): the index reads Start Menu shortcuts, and store apps have
none there, so "notepad" is not found. On Windows 11 that includes Notepad, Calculator, Paint,
Settings and the Photos app, the apps people ask for most.

## Scope
(updated 2026-11-07 after S2-03 and S2-04 merged (PR #79, #80, #81): the real `App` and `launch()`
shapes, and both readers timed on the owner's laptop)
- read the store apps' names and their **AppUserModelID** (the id Windows starts them by), from the
  shell's "Applications" folder (`shell:AppsFolder`). On the owner's laptop it lists 179 items,
  including Notepad (`Microsoft.WindowsNotepad_8wekyb3d8bbwe!App`), Calculator, Paint, Photos and
  Settings; the 120 apps the index already has are in it too, so add only names not yet indexed
- add them to `AppIndex` next to the shortcut apps; a shortcut app with the same name still wins
  (the scan order of S2-03: current user, all users, then store apps). `rebuild()` swaps in the
  whole new dict in one assignment, so keep that: S2-16 calls it from a worker thread while
  `find()` runs on another
- `launch_app` starts a store app through `shell:AppsFolder\<AppUserModelID>` with the same
  `ShellExecuteExW` call S2-04 uses. Today `launch_app` is `system.launch(app.shortcut)` and
  `WindowsSystem.launch(shortcut: Path)` passes `str(shortcut)` as the file to start. S2-04 returns
  None when Windows gives no process id, but its manual check never launched a store app: say in
  the PR whether Notepad or Calculator returns a pid
- `App` (frozen dataclass: `name`, `shortcut: Path`, `target: Path | None`) gains what a store app
  needs (its id) without breaking S2-03's and S2-04's tests (`FakeApp` in
  `tests/actions/conftest.py` has the same three fields). `target=None` already means "no program
  path", and `app_windows()` already refuses such an app with "a store app's windows can't be found
  yet", so focus and close stay a clean refusal
- (folded in from S2-21, 2026-11-07) a **damaged shortcut** is left out of the index, with a warning
  naming the file (an app's file name, not spoken words, so it may be logged). Found 2026-11-07
  with the real reader: garbage text, an empty file and a real shortcut cut to 40 bytes do **not**
  raise; each reads as `""`, and `rebuild()` then indexes it as an app with `target=None`, the same
  as a store app. So first a test with the real reader (`win32com`; the existing
  `test_the_real_reader_reads_a_real_shortcut` makes a real `.lnk`) with those three files next to
  a good one, and note whether other damage (a valid header, a bad body) raises; if the reader can
  raise, read each shortcut on its own so one bad file never ends `rebuild()`
- tell a damaged file from a real shortcut with no target (kept: 3 of 125, store apps). Likely: it
  is empty or does not start with the shell-link header (`4C 00 00 00`); check against the three
  cases above and the real Start Menu. This matters here because store apps arrive in this issue
  through the same `target=None` path
- tests with a fake reader, like S2-03's; one test reads the real folder (CI runs on Windows)

## Out of scope
Finding a store app's windows for focus and close (its window belongs to another program, as S2-04
found with Notepad): a follow-up if it is needed. Wiring the index into the voice path (S2-16).

## Done when
- [x] "notepad" and "calculator" are found on the owner's laptop, and launched by a manual check
- [x] a shortcut app still wins over a store app with the same name (tested)
- [x] a garbage `.lnk` is not in `apps` (test fails before the fix, passes after), a good shortcut
      with no target is still indexed, and a damaged one gives one warning and no crash
- [x] a failed launch says why: "isn't installed any more" (code 2 or 3, tested on real Windows),
      "Windows blocked the app" (5, 1260), "cancelled" (1223); Windows shows no error box of its own
- [x] the full suite and ruff pass

## How to test
```
cd agent
uv run pytest tests/intent -v
```

## Decisions (made 2026-11-07)
- Reading the folder: **pywin32** (`Shell.Application`, `NameSpace("shell:AppsFolder")`; already a
  dependency since S2-03). Measured on the owner's laptop (179 items each): pywin32 1.3-1.6 s warm,
  3.5 s on the first run; `Get-StartApps` 3.0 s warm, 7.0 s on the first run. No new dependency, 2x
  faster, and the item's `.Path` is the AppUserModelID. Both are slow next to the shortcut scan
  (0.2-0.4 s), so the rebuild stays off the voice path (S2-16's housekeeping worker). To check in
  the PR: the call works from a worker thread (it may need `pythoncom.CoInitialize()` there).
- Where the id lives: a **new optional `App` field** (`app_id: str | None`), and `launch_app` passes
  the id's `shell:AppsFolder\<id>` string for store apps. Not `shortcut = Path("shell:...")`: a
  `Path` that is not a file path is a trap for the next reader. `WindowsSystem.launch` and
  `FakeSystem.launch` take a string or path then.

## Decisions (made 2026-11-12, step 3 with the owner)
- **Only store apps come from `shell:AppsFolder`**: items whose AppUserModelID contains `!`
  (`Package_publisher!App`, 53 of 179). The other 126 (programs with their own id, `{known
  folder}\program.exe`, plain paths) already reach the index through their Start Menu shortcuts.
  A shortcut app with the same name wins.
- **The path to open follows the kind of app**: a store app has `app_id` and no shortcut
  (`shortcut=None`) and opens with `shell:AppsFolder\<app_id>`; every other app opens its shortcut,
  as before.
- **A damaged shortcut** (empty, or not starting with `4C 00 00 00`) is left out of the index with
  a warning naming the file.
- **The slower rebuild (1.3-3.5 s) is accepted**, no caching: it runs on the housekeeping worker.
- **An uninstalled app** stays in the index until the next rebuild (the index is a snapshot).
  To close that gap, a failed launch says why, from Windows' own error code (`GetLastError` after
  `ShellExecuteExW`), and only "gone" triggers a rebuild:
  - 2 or 3 (file or path not found, measured: an uninstalled shortcut app and an uninstalled store
    app both give 2): `AppNotInstalledError`, "the app isn't installed any more"; S2-16 rebuilds
    the index once
  - 5 or 1260 (access denied, blocked by policy): "Windows blocked the app"; no rebuild
  - 1223 (the admin prompt was answered "No"): "starting the app was cancelled"; no rebuild
  - anything else: "the app could not be started", as before
  Rejected: retrying after a rebuild and removing the app if it fails again (an installed app
  would then be reported as "no installed app matches" until the next rebuild), and keeping it
  and rebuilding on every failure (a rebuild that cannot help).
- **`SEE_MASK_FLAG_NO_UI`** on the launch: Listen speaks the error, Windows shows no box.

## Learning
AppUserModelIDs and how Windows starts store apps; reading a shell folder.
