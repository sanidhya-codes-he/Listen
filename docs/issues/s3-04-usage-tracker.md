# [S3-04] Usage tracker: which app is in front

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S3-02 |
| Labels | stage-3, agent |
| Spec | §5.5 |
| Status | todo |

## Goal
Every 2 seconds Listen notes the foreground app, and keeps one `app_sessions` row per stretch of use.

## Scope
- usage worker (uses `idle()` every 2 s): read the foreground window's process and title
- a change closes the current session row and opens a new one; publishes `ForegroundChanged`
- display names from the process with a small mapping (`Code.exe` -> "Visual Studio Code")
- locked screen, sleep and no foreground window are handled (no endless open session)
- the reader is injected (fake foreground source in tests)

## Out of scope
Site names from browser titles (S3-05); daily totals (S3-06).

## Done when
- [ ] a scripted sequence of fake windows produces the right sessions and durations
- [ ] sleeping the laptop does not count as hours of use (test with the fake clock)

## How to test
`cd agent; uv run pytest -k usage -v`

## Open decisions
- Windows calls through `pywin32` or `ctypes` (`GetForegroundWindow`, `GetWindowThreadProcessId`).

## Learning
Polling versus events; sessions from samples; edge cases around sleep and lock.
