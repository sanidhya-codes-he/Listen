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
(updated 2026-11-12 after S2-01 merged (PR #85): the real library types, what the starter files
assume, three promises handed over by the review, `commands try` goes next to `check`, uv commands)

- `intent/normalise.py`: lowercase; strip STT punctuation except `+` and `'`; remove a leaked wake
  word; remove filler at start/end ("please", "can you", "could you", "for me"); collapse spaces
- `intent/matcher.py`: the input is a `CommandLibrary` (`intent/library.py`; the agent gets one from
  `CommandFiles().library`; frozen, so a test builds one directly). Its `commands` tuple is already
  in tie order (sorted file names, then position in the file), with duplicate ids, bad entries and
  `defaults` pointing at a missing target already removed. Compile each `Command.patterns` string to
  an **anchored** regex; collect every full match whose
  slots validate (`{query}` 1+ words, `{target}` a name in `library.targets`, `{app}` via an injected
  app index, `{number}` digits or number words); pick the most specific (most literal words;
  `when_app` beats none; ties -> earlier in `library.commands`); fill a missing `{target}` from
  `library.defaults`; URL-encode values; return `Match(command, slots, match_confidence)` or
  `NotMatched`
  - **which verb a command uses** (S2-01 starter files): the command's `url_from` (`search`,
    `play`, `home`) names the key to read in `library.targets[target]` (the URL, with `{query}`
    inside) and in `library.defaults`. A target with no URL for that verb is the clear error in
    "Done when". `library.aliases` is **not** for the matcher: the app index gets it (S2-16).
  - **slots -> params** (what S2-01's starter files assume, to confirm in step 3): a slot reaches the
    primitive's param of the same name (`launch_app` takes `app`, `open_url` takes `url`, built from
    the target's URL and `{query}`); `core.yaml` writes no `params` for `open`, `focus`, `close`.
    Check the real names against `list_primitives()` and S2-05's `set_volume` when you start.
  - **handed over by the S2-01 review**: (1) a command whose `params` or `url_from` need a slot its
    patterns lack (a missing `{target}` is filled from `defaults`, so only the matcher knows) is
    reported, not guessed; (2) a pattern with no literal word (only slots or spaces passes the
    schema) must not match everything: decide what it compiles to and test it; (3) the schema
    allows any pattern text, so compile failures are the matcher's to catch, not a crash
- `listen commands try "<sentence>" [--app "<app>"]`: dry run, prints the decision. Add it in
  `build_parser` (`__main__.py`) as a second `files_actions.add_parser(...)` next to `check`, and a
  branch in `main` beside `check_commands`
- a table-driven test file with at least 40 sentences

## Out of scope
The real app index (S2-03: the matcher takes it as a parameter, with a fake in tests);
thresholds (S2-07); events and threads (S2-16); reloading command files (S2-16 calls
`reload_if_changed()`; the matcher just takes the library it is given).

## Done when
- [ ] the sentence table passes, including fillers, punctuation, wake-word leaks, ties, `when_app`
- [ ] a target without a URL for the verb returns a clear error, never a guess
- [ ] matching 1,000 sentences takes under 5 s in total (5 ms each)
- [ ] `listen commands try "search what is an atom"` shows the command, slots and URL

## How to test
```
cd agent
uv run pytest -k "normalise or matcher" -v
uv run listen commands try "please open vs code"
```

## Learning
Regular expressions and anchoring; pure functions; table-driven tests; dependency injection for the
app index.
