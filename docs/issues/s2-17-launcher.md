# [S2-17] Launcher: restart after a crash, one copy only

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | M3, S2-16 |
| Labels | stage-2, agent |
| Spec | §9.1 (agent crashes), §4.1 (escalation chain) |
| Status | todo |

## Goal
A tiny separate process starts the agent, restarts it after a crash (at most 3 times in 10
minutes, with a pop-up each time), and makes sure only one copy of Listen runs.

## Why
The last link of the escalation chain: thread error -> caught; thread dies -> new thread;
hang or crash loop -> process exits; process exits -> launcher restarts it.

## Scope
- `listen start` (or the launcher as the default for `listen run`: decide when updating this file)
- reacts to exit codes from M3: fatal/crash -> restart; bad settings -> do not restart, show why;
  clean stop -> do nothing
- after 3 restarts in 10 minutes: stop with "Listen stopped, see the log"
- **single-instance guard** (from the stage 1 review): a second launch says "already running" and
  exits, so two agents never share one log
- tests: the restart policy is pure and tested with the fake clock

## Out of scope
Starting at Windows login (S6-03).

## Done when
- [ ] policy tests: restart, give up after 3 in 10 minutes, never restart on bad settings
- [ ] manual: killing the agent process shows a pop-up and it comes back

## How to test
`cd agent; uv run pytest -k launcher -v`

## Open decisions
- Single-instance method: a named mutex (Windows) or a lock file with the process id.

## Learning
Processes versus threads; supervisors at two levels; exit codes as a contract (M3).
