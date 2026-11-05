# [S2-04] Primitive registry and app/URL primitives

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S1 |
| Labels | stage-2, agent |
| Spec | §3.5, §9.3 (actions tested against fakes) |
| Status | in progress |

## Goal
A fixed allowlist of actions Listen is able to perform, each in its own file, and fakes so tests
never open real apps.

## Why
Safety: there is **no** "run any program" primitive. Every capability is named, reviewed and
tested. The registry also tells the AI builder (S5-09) and the server what exists.

## Scope
(updated 2026-11-04 before starting: safety, privacy and the open decision settled)
- `actions/registry.py`: `@primitive(name, params=...)` decorator; importing every file in
  `actions/primitives/` at start-up; `list_primitives()`; `run(name, system, **params)` checks the
  parameters (unknown action, missing, unexpected or wrong-typed parameter -> `ActionError`)
- primitives: `open_url` (default browser; http and https only), `launch_app` (starts the app's
  **shortcut** like a double-click; returns the process id for undo, or None when Windows gives
  none), `focus_app` (an error if Windows refuses), `close_app` (polite close, like clicking X;
  never the desktop or the taskbar, which belong to `explorer.exe` too)
- **no "run any program"**: the app primitives take an app **name** and resolve it through the app
  index (S2-03), so only installed Start Menu apps can be launched, focused or closed. S2-04 does
  not depend on S2-03: the index is injected into the system object (S2-16 wires the real one)
- **privacy**: app names and URLs come from spoken words, so `ActionError` messages say what went
  wrong without quoting them (`CODING_STANDARDS.md` rule 1), and Python's own errors, which do
  quote them, are replaced (`from None`)
- an injected `system` object that does the real Windows calls (`WindowsSystem`, with `ctypes`),
  and `FakeSystem` for tests that records calls

## Out of scope
Volume and keys (S2-05); the executor, undo and routines (S2-06).

## Done when
- [x] each primitive validates its parameters and returns a result or a clear error
- [x] tests use `FakeSystem` only; nothing opens during `pytest`
- [x] a manual check (documented in the PR) opens a URL and launches, focuses and closes
      Character Map (Notepad is a store app on Windows 11: its window belongs to another program)
- [x] (review of PR #80) launched from a worker thread: a shortcut with arguments (Anaconda
      Prompt) keeps them, an `.msc` tool (Event Viewer) starts, Command Prompt gets its own window

## How to test
```
cd agent
uv run pytest tests/actions -v
```

## Decisions (made 2026-11-04)
- Polite close and focus with **`ctypes`** (standard library): no new dependency, and this PR
  then leaves `uv.lock` alone, so it cannot conflict with S2-03's PR, which adds pywin32.
- (review of PR #80, 2026-11-05) **Launch the shortcut, not its target**, with `ShellExecuteExW`:
  starting the bare target dropped the shortcut's arguments and "Start in" folder and failed on
  non-programs, which broke 49 of 120 apps on the owner's laptop (Jupyter, Anaconda Prompt, Event
  Viewer...). The target stays in the app index for finding windows (focus, close).

## Learning
Decorators that register things; plugin folders; fakes for side effects (Doc 10 §13).
