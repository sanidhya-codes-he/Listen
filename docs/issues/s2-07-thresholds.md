# [S2-07] Confidence thresholds, risk and continuous-mode guardrails

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-02 |
| Labels | stage-2, agent |
| Spec | §3.6, §3.7, §11 (starting thresholds) |
| Status | todo |

## Goal
One pure function decides **run, confirm or ignore** for every heard sentence.

## Why
Running the wrong command (closing an app by mistake) is worse than asking or doing nothing. The
rules are subtle (mode, risk, two scores, per-command settings), so they live in one tested place.

## Scope
- `intent/decide.py`: inputs = mode (wake / push_to_talk / continuous), hearing confidence, match,
  word count, the command's `risk` and `continuous` setting, `Settings.thresholds`; output =
  `Run`, `Confirm`, `Ignore(reason)`
- high risk uses the higher pair; continuous mode adds `continuous_extra` to each threshold
- continuous guardrails: at most 8 words; `continuous: block|confirm|allow` (close_app defaults to
  confirm; routines allow)
- settings check added here: base threshold + `continuous_extra` must stay <= 1; high-risk values
  >= normal ones (declined in the stage 1 review, belongs here)

## Out of scope
The busy-room automatic fallback (needs audio statistics: S2-14).

## Done when
- [ ] a decision table test covers every combination that matters (at least 25 rows)
- [ ] the settings cross-checks stop start-up with a clear message

## How to test
`agent/.venv/Scripts/python -m pytest agent -k "decide or thresholds" -v`

## Learning
Decision tables; why thresholds are placeholders until calibrated (stage 3 data).
