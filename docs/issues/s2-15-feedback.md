# [S2-15] Feedback: chimes, pop-ups and ducking

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-08 |
| Labels | stage-2, agent |
| Spec | §4.5, §3.7 (quiet continuous mode), §9.1 (pop-ups) |
| Status | todo |

## Goal
The owner always knows what Listen is doing without looking at the terminal: four chimes, Windows
notifications, and other apps turned down while speaking.

## Why
Listen has no spoken replies (§1.2), so sound and pop-ups are its only voice. Ducking makes the
microphone hear the owner instead of the music.

## Scope
- four chimes via `winsound` (listening, done, question, not caught); sound files in `agent/sounds/`
- Windows notifications (bottom right; kept in Action Center)
- ducking: other apps' audio sessions (not master, not Listen's own) to 20% from capture start until
  transcription starts; original levels written to a **restore file first**; restored on the next
  start after a crash; never in continuous mode
- continuous mode is quiet: only "done" (and "question" for confirm commands)
- sets the "chime playing" flag the listener uses to ignore the microphone
- injected `player`, `notifier`, `mixer` with fakes in tests

## Out of scope
The tray icon (S6-01).

## Done when
- [ ] tests check which chime and pop-up each event produces, in each mode, with fakes
- [ ] crash test: kill the agent while ducked; next start restores the levels (manual, in the PR)

## How to test
`cd agent; uv run pytest -k "feedback or ducking" -v`

## Open decisions
- Notifications library (`win11toast`, `winotify`, or `windows-toasts`): pick the maintained one.
- Chime sounds: make them, or use free sounds with a compatible licence (record the source).

## Learning
Crash-safe state (write the undo information before changing anything); audio sessions on Windows.
