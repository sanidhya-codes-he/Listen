# [S2-04] Primitive registry and app/URL primitives

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S1 |
| Labels | stage-2, agent |
| Spec | §3.5, §9.3 (actions tested against fakes) |
| Status | todo |

## Goal
A fixed allowlist of actions Listen is able to perform, each in its own file, and fakes so tests
never open real apps.

## Why
Safety: there is **no** "run any program" primitive. Every capability is named, reviewed and
tested. The registry also tells the AI builder (S5-09) and the server what exists.

## Scope
- `actions/registry.py`: `@primitive(name, params=...)` decorator; importing every file in
  `actions/primitives/` at start-up; `list_primitives()`
- primitives: `open_url` (default browser), `launch_app` (returns the process id for undo),
  `focus_app`, `close_app` (polite close, like clicking X)
- an injected `system` object that does the real Windows calls, and `FakeSystem` for tests that
  records calls (`[("launch_app", "Visual Studio Code")]`)

## Out of scope
Volume and keys (S2-05); the executor, undo and routines (S2-06).

## Done when
- [ ] each primitive validates its parameters and returns a result or a clear error
- [ ] tests use `FakeSystem` only; nothing opens during `pytest`
- [ ] a manual check (documented in the PR) opens a URL and launches and closes Notepad

## How to test
`agent/.venv/Scripts/python -m pytest agent -k primitive -v`

## Open decisions
- Polite close: send `WM_CLOSE` to the app's windows via `pywin32`, or `ctypes` directly?

## Learning
Decorators that register things; plugin folders; fakes for side effects (Doc 10 §13).
