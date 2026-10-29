# [S2-11] `listen record-tests`: the owner's voice clips

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-09 |
| Labels | stage-2, agent |
| Spec | §9.3 (speech tests), §5.2 (the one exception to "no audio") |
| Status | todo |

## Goal
About 20 short recordings of the owner saying real commands, stored only on the laptop, used by the
speech tests and the benchmark.

## Why
Speech tests must use the owner's real voice and accent, but the repo is public and audio must never
be synced. This is the single deliberate exception to "no audio is ever saved".

## Scope
- `listen record-tests`: shows a sentence, records it (press Enter to start/stop), saves
  `agent/tests/audio/clips/NN.wav` + an `expected.yaml` with the sentence
- the folder is already git-ignored; a test asserts `git check-ignore` covers it
- `pytest` marker: speech tests are **skipped** when the folder is empty (as on GitHub)

## Out of scope
The benchmark itself (S2-12).

## Done when
- [ ] 20 clips recorded by the owner; `git status` shows nothing new
- [ ] on CI the speech tests show as skipped, not failed

## How to test
```
cd agent
uv run listen record-tests
uv run pytest -k speech -v
```

## Learning
WAV files; pytest skip markers; the difference between test data and private data.
