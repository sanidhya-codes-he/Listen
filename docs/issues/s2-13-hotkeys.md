# [S2-13] Hotkeys: push-to-talk and continuous toggle

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-08 |
| Labels | stage-2, agent |
| Spec | §4.1 (hotkeys thread), §11 (Ctrl+Alt+Space, Ctrl+Alt+C) |
| Status | todo |

## Goal
Holding Ctrl+Alt+Space publishes press and release events; Ctrl+Alt+C toggles continuous mode;
both work while any app has focus.

## Why
Push-to-talk is the fallback when the wake word fails or the room is noisy (§1.1).

## Scope
- hotkeys worker with a global keyboard hook; publishes `PushToTalkPressed/Released`, `ModeChanged`
- hotkey strings from `settings.yaml` are **validated** here ("ctrl+alt+spcae" is refused at
  start-up, a check declined in the stage 1 review)
- tests: parsing and validation are pure; the hook is behind an injected interface with a fake

## Out of scope
What happens after the key press (S2-14).

## Done when
- [ ] invalid hotkey strings stop start-up with a clear message
- [ ] manual check: push-to-talk works while VS Code and Chrome have focus

## How to test
`cd agent; uv run pytest -k hotkey -v`

## Open decisions
- Library: `keyboard` (simple, global hooks) or `pynput`. Check which handles key **release**
  reliably on Windows 11.

## Learning
Global keyboard hooks; parsing a small text format; events for press and release.
