# [M3] Give "bad settings" its own exit code

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, follow-up |
| Spec | §9.1 (launcher) |
| Status | in progress |

## Goal
Every exit code means exactly one thing, so the launcher (S2-17) can react correctly.

## Why
`EXIT_BAD_SETTINGS = 2` is also argparse's code for "bad command line" (`listen bogus` exits 2). The
launcher could not tell "fix settings.yaml" from "you typed a wrong command".

## Scope
(updated 2026-11-02 before starting: number decided; places to change listed; uv commands)
- `app.py`: `EXIT_BAD_SETTINGS = 78`, the Unix convention for "configuration error" (`EX_CONFIG`
  in `sysexits.h`); keep 0 (stopped), 1 (Python crash), 2 (argparse), 3 (crash loop / hang)
- tests: bad settings exits 78; `listen bogus` still exits 2; the two codes differ
- update Doc 10 (exit-code table, the "code 2 is used twice" paragraph, the three places that say
  bad settings give exit code 2) and rebuild its PDF; `docs/cheatsheet.md` exit-code line

## Out of scope
The launcher itself (S2-17).

## Decision
78 rather than a small number like 4: it already means "configuration error" to anyone who knows the
`sysexits.h` convention, and it can never collide with codes 0 to 3.

## Done when
- [x] `listen bogus` exits 2; a bad `settings.yaml` exits 78
- [x] tests, Doc 10 and the cheat sheet agree

## How to test
```
cd agent
uv run pytest -k "app or cli" -v
uv run listen bogus ; echo $LASTEXITCODE
```

## Learning
Exit codes as a contract between programs; conventions (`sysexits.h`).
