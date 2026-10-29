# [S2-10] Wake word ("Hey Jarvis")

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-09 |
| Labels | stage-2, agent |
| Spec | §4.2, §4.4 |
| Status | todo |

## Goal
Saying "Hey Jarvis" publishes `WakeWordDetected`, reliably, without false triggers from normal room
noise, and only spending CPU when VAD reports speech.

## Why
The default listening mode (§1.1). It must be both responsive and cheap enough to run all day.

## Scope
- openWakeWord with the pre-trained "hey jarvis" model, run only on VAD-speech chunks
- detection threshold as a setting; a short cooldown so one phrase triggers once
- ignore the microphone while a chime plays (§4.2): a flag the feedback module (S2-15) sets
- measure: detections in 20 tries; false triggers during 30 minutes of normal room sound

## Out of scope
Custom wake words; the listener state machine (S2-14).

## Done when
- [ ] at least 18 of 20 wake-ups detected on the owner's voice (manual, documented in the PR)
- [ ] no more than 1 false trigger in 30 minutes of room noise
- [ ] unit tests with a fake model object for threshold and cooldown logic

## How to test
`cd agent; uv run pytest -k wake -v` plus the manual measurement above.

## Learning
Pre-trained models; precision versus recall (false triggers versus missed wake-ups); thresholds.
