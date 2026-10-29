# [S2-12] Transcriber and model benchmark

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-09, S2-11 |
| Labels | stage-2, agent |
| Spec | §4.4, §4.6 (500 ms STT budget), §9.4 (benchmark) |
| Status | todo |

## Goal
A recording becomes text with a hearing confidence in about 500 ms or less, using the smallest
Whisper model that is accurate enough on the owner's voice.

## Why
Speech-to-text is the slowest step of the 1.5 s budget and the biggest source of misheard commands.
The model choice must be measured, not guessed.

## Scope
- transcriber worker: faster-whisper, `int8`, English model; one recording at a time; heartbeat
  before and after each transcription (§4.1); publishes `Transcribed(text, confidence, ms)`
- confidence derived from Whisper's segment probabilities (document the formula)
- benchmark command: `tiny.en` vs `base.en` on the 20 clips (or live): word accuracy and STT time
  (median and worst); silence wait tested at 0.5 to 0.9 s
- record the result and the chosen model in the PR and in Doc 11; model name becomes a setting
- model fails to load -> pop-up naming the problem; stop at start-up (§9.1)

## Out of scope
Cloud speech-to-text (not built in v1).

## Done when
- [ ] speech tests pass on the laptop: expected words and the 500 ms budget (median)
- [ ] benchmark table committed to the PR description
- [ ] logs contain timings only, never the text (unless debug is on)

## How to test
```
cd agent
uv run pytest -k "transcriber or speech" -v
uv run listen benchmark
```

## Open decisions
- Benchmark as a `listen benchmark` subcommand or a script in `agent/tools/`?

## Learning
Model size versus accuracy versus latency; quantisation (`int8`); medians versus averages.
