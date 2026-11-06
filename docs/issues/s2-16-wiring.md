# [S2-16] Wiring it together: intent worker and the full voice path

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-02, S2-03, S2-06, S2-07, S2-14, S2-15 |
| Labels | stage-2, agent |
| Spec | §4.1 (threads), §4.3 (events), §4.6 (latency), §4.7 (start-up order), §4.8 (terminal lines) |
| Status | todo |

## Goal
`listen run` is a working voice assistant: speech in, action out, every step and its timing shown in
the terminal.

## Why
Each part was built and tested alone. This issue connects them through the bus and proves the whole
path meets the 1.5 s budget.

## Scope
- intent worker: `Transcribed` -> normalise, match, decide (S2-07) -> `IntentMatched` /
  `IntentNotMatched` / `ConfirmationRequested`; continuous-mode unmatched -> `HeardInContinuous`
- housekeeping worker: every 2 s, microphone change and command-file reload; the app index's `rebuild()` daily and
  on the command "refresh apps" (moved here from S2-03)
- the app index gets its aliases from the command library (S2-01) and its match threshold (0.8, a
  constant in S2-03) from `settings.yaml` (spec §3.4 says it is tunable; review of PR #79)
- start-up order from §4.7 (settings -> commands -> app index -> restore ducked volumes -> models ->
  microphone -> threads -> "Listen is ready"); shut-down order from §4.7
- the terminal shell's lines from §4.8 (`heard "..." (0.93)`, `match ...`, `done ...`,
  `timing silence 700 | stt 412 | match 1 | action 140 | total 1253 ms`)
- the remaining §4.3 events defined in `events.py`
- an end-to-end test with fakes: a fake `Transcribed` event leads to the right fake action

## Out of scope
Saving commands to SQLite (S3-03).

## Done when
- [ ] end-to-end test with fakes passes
- [ ] on the laptop: 20 real commands, median total under 1.5 s, results table in the PR
- [ ] Ctrl+C stops cleanly in the §4.7 order, restoring volumes

## How to test
```
cd agent
uv run pytest -v
uv run listen run
```

## Learning
Integration versus unit tests; measuring a pipeline; start-up ordering and why it matters.
