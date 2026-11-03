# [M6] Fix the outdated sentence in `agent/README.md`

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, docs, follow-up |
| Spec | none |
| Status | **done**: PR #73 |

## Goal
`agent/README.md` describes the folder as it is now.

## Why
Line 4 still says `pyproject.toml` is "added when we build". It exists since stage 1.

## Scope
(updated 2026-11-02 before starting: S2-08 already rewrote the set-up sections for uv)
- rewrite line 4: what `pyproject.toml` holds (dependencies, the `listen` command, tool settings)
- the folder now also has `uv.lock`, `.python-version` (S2-08), `settings.yaml` and the git-ignored
  `logs/` (stage 1); describe each in one line
- check the rest of the README against the folder

## Done when
- [x] the README matches the folder; links work on GitHub

## How to test
Open the file on GitHub after pushing and read it.

## Learning
The smallest possible PR: a good first one to do completely by yourself (branch, edit, commit,
push, `gh pr create`, `gh pr merge`).
