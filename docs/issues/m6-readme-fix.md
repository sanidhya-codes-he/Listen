# [M6] Fix the outdated sentence in `agent/README.md`

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, docs, follow-up |
| Spec | none |
| Status | todo |

## Goal
`agent/README.md` describes the folder as it is now.

## Why
Line 4 still says `pyproject.toml` is "added when we build". It exists since stage 1.

## Scope
- rewrite line 4: what `pyproject.toml` holds (dependencies, the `listen` command, tool settings)
- check the rest of the README against the folder

## Done when
- [ ] the README matches the folder; links work on GitHub

## How to test
Open the file on GitHub after pushing and read it.

## Learning
The smallest possible PR: a good first one to do completely by yourself (branch, edit, commit,
push, `gh pr create`, `gh pr merge`).
