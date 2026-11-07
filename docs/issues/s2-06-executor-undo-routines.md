# [S2-06] Executor, undo and routines

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-04, S2-05 |
| Labels | stage-2, agent |
| Spec | §3.8 (routines), §3.9 (undo), §9.1 (action fails) |
| Status | todo |

## Goal
A matched command runs its action (or each routine step), and "undo" within 60 s reverses the last
successful command when that is possible.

## Why
Undo makes voice control safe to experiment with; routines ("dsa" = open three things) are one of
the owner's main uses.

## Scope
(updated 2026-11-07 after S2-04 merged (PR #80): what `launch_app` returns, what undo can find, and
the privacy rule for failures)
- `actions/executor.py` as a `Worker`: runs a command with `run(name, system, **params)`; publishes
  `CommandExecuted` / `CommandFailed` (new events, with timings)
- a failure message is safe to log and show only when it is an `ActionError` (S2-04: those never
  quote spoken words); any other exception is logged with a fixed text, because Python's own
  messages quote values (`CODING_STANDARDS.md` rule 1)
- one undo slot: filled only by a **successful** command; "undo" within **60 s** reverses it and
  empties the slot; meta-commands never replace it; no reliable inverse -> "I can't undo that"
- inverses: volume/mute restore exactly; `launch_app` closes the instance Listen started (by process
  id); `press_keys` only with a declared `undo: {keys: ...}`; `close_app`, `open_url` cannot be undone
- `launch_app` returns the process id **or None** (store apps, or an app that hands over to a copy
  already running, like Chrome): None -> "I can't undo that". The pid may also be a launcher that
  has exited by the time of "undo": same answer, never a guess
- undo by pid needs a **new** system call that finds windows by process id. Today only
  `windows_of(program)` exists, and it matches by program path, so using it would close every
  window of that program (Anaconda Prompt's target is `cmd.exe`, Jupyter's is `python.exe`; on the
  owner's laptop 49 of 120 shortcuts carry arguments or point at a non-program). Add it to
  `WindowsSystem` and `FakeSystem` (`FakeSystem.pid` sets what `launch` returns)
- the manual check must try undoing a console app (Command Prompt, own window since PR #80): its
  window may belong to the terminal program, not to the pid (not checked in S2-04)
- routines: steps in order with a short pause; a failed step does not stop the others; one summary
  ("Routine DSA: 2 of 3 steps done; CLion not found"); undo reverses undoable steps newest first
- (from S2-04's manual check) a launched app's window appears 0.5-1.2 s after `launch_app`
  returns: wait for it before counting the launch done, focusing it or undoing it
- (from S2-04's manual check) apps running as administrator (Event Viewer) can't be focused or
  closed by Listen (Windows' UIPI): `WindowsSystem.close_window` ignores `PostMessageW`'s result
  today (it returns nothing), so check it and have `close_app` report "that app runs as
  administrator" instead of counting the window as closed. (Event Viewer's index target is an
  `.msc` file, not a program, so `windows_of` cannot find its window at all; test with another
  elevated app)
- tests with `FakeSystem` (`tests/actions/conftest.py`; it records calls, so move it up to
  `tests/conftest.py` if the executor tests live outside `tests/actions`) and the `FakeClock`
  (60 s expiry)

## Out of scope
Confirmation questions (S2-07, S2-14); Chrome profiles (S6-02).

## Done when
- [ ] undo table from §3.9 covered by tests, including the 60 s expiry with the fake clock
- [ ] a failed action leaves the undo slot untouched
- [ ] routine summary wording matches the spec example

## How to test
```
cd agent
uv run pytest -k "executor or undo or routine" -v
```

## Learning
Inverse operations; a single-slot undo; time-based rules tested with a fake clock.
