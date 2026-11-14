# [S2-16] Wiring it together: intent worker and the full voice path

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-02, S2-03, S2-06, S2-07, S2-14, S2-15, S2-20 |
| Labels | stage-2, agent |
| Spec | §4.1 (threads), §4.3 (events), §4.6 (latency), §4.7 (start-up order), §4.8 (terminal lines) |
| Status | todo |

## Goal
`listen run` is a working voice assistant: speech in, action out, every step and its timing shown in
the terminal.

## Why
Each part was built and tested alone. This issue connects them through the bus and proves the whole
path meets the 1.5 s budget.

## Scope
(updated 2026-11-07 after S2-03 and S2-04 merged (PR #79, #80, #81): who builds the real app index
and system object, and what a rebuild costs; updated 2026-11-12 after S2-01 merged (PR #85): the
reload call, `library.problems` pop-ups and aliases that must follow a reload)
- build the real `AppIndex(start_menu_folders(), aliases=..., threshold=...)` and give it to
  `WindowsSystem(apps)` (`actions/windows.py`); S2-04 injects the index as `system.apps`, and
  nothing builds either one yet. Call `load_primitives()` once at start-up: the registry does not
  import the primitive files by itself
- intent worker: `Transcribed` -> normalise, match, decide (S2-07) -> `IntentMatched` /
  `IntentNotMatched` / `ConfirmationRequested`; continuous-mode unmatched -> `HeardInContinuous`
- housekeeping worker: every 2 s, microphone change and command-file reload; the app index's `rebuild()` daily and
  on the command "refresh apps" (moved here from S2-03)
- when `launch_app` raises `AppNotInstalledError` (S2-20: Windows says the file or app id is gone),
  rebuild the app index once, so the uninstalled app drops out; any other launch error gives no
  rebuild (decided 2026-11-12 in S2-20's step 3)
- command-file reload (S2-01, PR #85): the agent holds one `CommandFiles()`; the housekeeping worker
  calls `reload_if_changed()` and the intent worker reads `.library` (a frozen `CommandLibrary`
  swapped in one assignment). When it returns True: (1) show each new line of `library.problems`
  as a pop-up with `file:line` through S2-15's notifier (spec §9.1), once per distinct line, not
  every 2 s; (2) pass the new `library.aliases` to the app index: `AppIndex` copies its aliases in
  `__init__` (`self.aliases`), so an edited alias is otherwise ignored until restart (add a small
  setter or rebuild the index; test it)
- the app index gets its aliases from the command library (S2-01) and its match threshold (0.8, a
  constant `MATCH_THRESHOLD` in `intent/app_index.py`) from `settings.yaml` (spec §3.4 says it is
  tunable; review of PR #79)
- `rebuild()` cost on the owner's laptop: 0.2-0.4 s warm, about 4 s on the first, cold run (PR #79
  review), and S2-20 will add more. A first build at start-up delays "Listen is ready": put it in
  the start-up timing. Daily and "refresh apps" rebuilds run on the housekeeping worker; the
  review confirmed `rebuild()` works from a worker thread, and it swaps the whole dict in one
  assignment, so `find()` on the intent worker never sees a half-built index
- start-up order from §4.7 (settings -> commands -> app index -> restore ducked volumes -> models ->
  microphone -> threads -> "Listen is ready"); shut-down order from §4.7
- the terminal shell's lines from §4.8 (`heard "..." (0.93)`, `match ...`, `done ...`,
  `timing silence 700 | stt 412 | match 1 | action 140 | total 1253 ms`)
- the remaining §4.3 events defined in `events.py`
- an end-to-end test with fakes: a fake `Transcribed` event leads to the right fake action

## Out of scope
Saving commands to SQLite (S3-03).

## Done when
- [ ] end-to-end test with fakes passes
- [ ] on the laptop: 20 real commands, median total under 1.5 s, results table in the PR
- [ ] Ctrl+C stops cleanly in the §4.7 order, restoring volumes

## How to test
```
cd agent
uv run pytest -v
uv run listen run
```

## Learning
Integration versus unit tests; measuring a pipeline; start-up ordering and why it matters.
