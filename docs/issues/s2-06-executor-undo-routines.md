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
- `actions/executor.py` as a `Worker`: runs a command; publishes `CommandExecuted` / `CommandFailed`
  (new events, with timings)
- one undo slot: filled only by a **successful** command; "undo" within **60 s** reverses it and
  empties the slot; meta-commands never replace it; no reliable inverse -> "I can't undo that"
- inverses: volume/mute restore exactly; `launch_app` closes the instance Listen started (by process
  id); `press_keys` only with a declared `undo: {keys: ...}`; `close_app`, `open_url` cannot be undone
- routines: steps in order with a short pause; a failed step does not stop the others; one summary
  ("Routine DSA: 2 of 3 steps done; CLion not found"); undo reverses undoable steps newest first
- tests with `FakeSystem` and the `FakeClock` (60 s expiry)

## Out of scope
Confirmation questions (S2-07, S2-14); Chrome profiles (S6-02).

## Done when
- [ ] undo table from §3.9 covered by tests, including the 60 s expiry with the fake clock
- [ ] a failed action leaves the undo slot untouched
- [ ] routine summary wording matches the spec example

## How to test
`agent/.venv/Scripts/python -m pytest agent -k "executor or undo or routine" -v`

## Learning
Inverse operations; a single-slot undo; time-based rules tested with a fake clock.
