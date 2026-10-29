# [S2-14] Listener state machine

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-10, S2-12, S2-13 |
| Labels | stage-2, agent |
| Spec | §4.2, §3.7 (busy-room fallback) |
| Status | todo |

## Goal
One worker turns wake words, hotkeys and audio into finished recordings for the transcriber, in all
three listening modes.

## Why
This is where the modes meet. A state machine makes every situation explicit, so "what happens if
the hotkey is released while transcribing?" has a written answer and a test.

## Scope
- states: `Idle -> Capturing -> Transcribing -> Idle`, and `Awaiting yes/no` (up to 8 s, no wake
  word needed; "yes" runs, "no" or timeout cancels)
- triggers: wake word (only on VAD-speech chunks), hotkey pressed, speech in continuous mode
- end of capture: **0.7 s** of silence (setting), hotkey released, or 8 s maximum
- the 0.3 s pre-roll is prepended to every recording; the microphone is ignored while a chime plays
- continuous mode: standalone sentences only; busy-room fallback to wake-word mode when speech fills
  more than about 60% of the last minute
- every transition tested with fake events and the fake clock (no audio needed)

## Out of scope
Matching and running (S2-16).

## Done when
- [ ] a transition table test covers every state and trigger (including odd orders)
- [ ] manual check of all three modes documented in the PR

## How to test
`cd agent; uv run pytest -k listener -v`

## Learning
State machines and transition tables; designing for "impossible" event orders.
