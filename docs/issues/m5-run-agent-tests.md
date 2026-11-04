# [M5] Automated tests for `run_agent`: Ctrl+C and fatal stop

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1, M3 |
| Labels | stage-2, agent, follow-up |
| Spec | §4.7 (start-up and shut-down) |
| Status | in progress |

## Goal
The two main ways the agent stops are covered by tests, not only by a manual check.

## Why
Only the "bad settings" path of `run_agent` is tested. Ctrl+C (exit 0, "stopped" logged) and a fatal
supervisor decision (exit 3) were checked by hand once.

## Scope
(updated 2026-11-04 before starting: uv command; settings and logs both in `tmp_path`)
- both tests give `run_agent` a settings file and a log folder inside `tmp_path`, so they never
  touch the real `agent/settings.yaml` or `agent/logs/`
- test 1: start `run_agent`; after "Listen is ready" is printed, raise
  `KeyboardInterrupt` in the main thread (`_thread.interrupt_main()` from a timer); assert exit 0,
  "Stopping..." printed, "stopped (exit code 0)" in the log
- test 2: make the app call `fatal(...)` shortly after start (monkeypatch); assert exit 3 and
  "stopping:" logged

## Out of scope
The launcher reacting to these codes (S2-17).

## Done when
- [x] both tests pass in under 3 seconds each, locally and on CI (Windows)
- [x] no stray threads left running after the tests

## How to test
```
cd agent
uv run pytest tests/test_app.py -v
```

## Learning
Testing a long-running loop; `_thread.interrupt_main`; why tests must clean up threads.
