# [S6-01] System tray shell

| | |
|---|---|
| Stage | S6 later |
| Depends on | S2-17 |
| Labels | stage-6, agent |
| Spec | §2 (`Shell` interface), §1.2 (tray later) |
| Status | todo |

## Goal
Listen runs without a terminal window: a tray icon shows its state and offers the main actions.

## Scope
- a `Shell` interface with two implementations: the existing terminal shell and a tray shell
- tray icon: state (listening, continuous on, error), menu: pause, continuous on/off, open log,
  open web app, quit
- the launcher starts the tray version by default

## Done when
- [ ] the icon reflects `ModeChanged` and `ModuleError`; quit stops cleanly
- [ ] the terminal shell still works with `listen run --terminal`

## How to test
`cd agent; uv run pytest -k shell -v` plus a manual check.

## Open decisions
- Tray library (`pystray` is the common choice).

## Learning
Interfaces with two implementations; GUI event loops versus worker threads.
