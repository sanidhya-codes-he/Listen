# [S2] Stage 2: voice agent in the terminal

| | |
|---|---|
| Kind | stage issue (milestone "Stage 2: voice agent in the terminal") |
| Depends on | S1 |
| Labels | stage-2 |
| Spec | §3 (commands), §4 (agent internals), §9.1, §9.3, §9.4 |
| Status | todo |

## Goal
Say "hey jarvis, open vs code" (or hold Ctrl+Alt+Space) and Listen does it in under about 1.5 s,
showing every step and its timing in the terminal. Nothing is saved to a database yet (stage 3).

## Tasks (sub-issues)
- Follow-ups first: M1 pin dev tools, M2 strict YAML, M3 exit codes, M4, M5, M6
- Commands track: S2-01 command files -> S2-02 matcher -> S2-07 thresholds; S2-03 app index
- Actions track: S2-04 primitives -> S2-05 volume and keys -> S2-06 executor, undo, routines
- Audio track: S2-08 switch to uv -> S2-09 audio + VAD -> S2-10 wake word, S2-11 test clips ->
  S2-12 transcriber + benchmark; S2-13 hotkeys -> S2-14 listener state machine
- S2-15 feedback (chimes, pop-ups, ducking)
- S2-16 wiring end to end -> S2-17 launcher, S2-18 debug switch -> S2-19 Doc 11

## Done when
- [ ] every task issue above is closed
- [ ] by voice and by push-to-talk: open, search, close (with confirmation), volume, play, a routine
      and undo all work on the owner's laptop
- [ ] the terminal shows `timing silence | stt | match | action | total` for every command
- [ ] benchmark result recorded: chosen model, median STT time, accuracy on the owner's clips
- [ ] CI green; Doc 11 written
