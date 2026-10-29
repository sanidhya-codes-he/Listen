# [S2-02] Normaliser and matcher

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-01 |
| Labels | stage-2, agent |
| Spec | §3.2 (slots), §3.3 (matching), Doc 03 |
| Status | todo |

## Goal
A **pure function** turns a sentence into the best matching command with its filled slots, or a
clear "not matched", in under 5 ms.

## Why
Matching is the heart of Listen and the easiest part to get wrong silently ("open vs code" running
"open youtube"). Kept pure (no threads, no Windows calls), it can be tested exhaustively with a table
of sentences, including every past mistake as a regression row.

## Scope
- `intent/normalise.py`: lowercase; strip STT punctuation except `+` and `'`; remove a leaked wake
  word; remove filler at start/end ("please", "can you", "could you", "for me"); collapse spaces
- `intent/matcher.py`: compile each pattern to an **anchored** regex; collect every full match whose
  slots validate (`{query}` 1+ words, `{target}` known names, `{app}` via an injected app index,
  `{number}` digits or number words); pick the most specific (most literal words; `when_app` beats
  none; ties -> earlier in file order); fill a missing `{target}` from `defaults`; URL-encode values;
  return `Match(command, slots, match_confidence)` or `NotMatched`
- `listen commands try "<sentence>" [--app "<app>"]`: dry run, prints the decision
- a table-driven test file with at least 40 sentences

## Out of scope
The real app index (S2-03: the matcher takes it as a parameter, with a fake in tests);
thresholds (S2-07); events and threads (S2-16).

## Done when
- [ ] the sentence table passes, including fillers, punctuation, wake-word leaks, ties, `when_app`
- [ ] a target without a URL for the verb returns a clear error, never a guess
- [ ] matching 1,000 sentences takes under 5 s in total (5 ms each)
- [ ] `listen commands try "search what is an atom"` shows the command, slots and URL

## How to test
```
agent/.venv/Scripts/python -m pytest agent -k "normalise or matcher" -v
agent/.venv/Scripts/listen commands try "please open vs code"
```

## Learning
Regular expressions and anchoring; pure functions; table-driven tests; dependency injection for the
app index.
