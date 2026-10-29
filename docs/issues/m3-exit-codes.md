# [M3] Give "bad settings" its own exit code

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, follow-up |
| Spec | §9.1 (launcher) |
| Status | todo |

## Goal
Every exit code means exactly one thing, so the launcher (S2-17) can react correctly.

## Why
`EXIT_BAD_SETTINGS = 2` is also argparse's code for "bad command line" (`listen bogus` exits 2). The
launcher could not tell "fix settings.yaml" from "you typed a wrong command".

## Scope
- `app.py`: choose a new number for bad settings and keep 0 (stopped), 1 (Python crash),
  2 (argparse), 3 (crash loop / hang)
- update `test_app.py`, Doc 10's exit-code table, `docs/cheatsheet.md`

## Out of scope
The launcher itself (S2-17).

## Done when
- [ ] `listen bogus` exits 2; a bad `settings.yaml` exits with the new code
- [ ] tests, Doc 10 and the cheat sheet agree

## How to test
```
agent/.venv/Scripts/python -m pytest agent -k app -v
agent/.venv/Scripts/listen bogus ; echo $LASTEXITCODE
```

## Open decisions
- 78 (the Unix tradition `EX_CONFIG`, "configuration error") or a small number like 4?

## Learning
Exit codes as a contract between programs; conventions (`sysexits.h`).
