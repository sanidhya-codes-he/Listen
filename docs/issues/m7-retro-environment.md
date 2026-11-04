# [M7] Retro: agent environment

| | |
|---|---|
| Stage | S2 (follow-up from the retrospective of 2026-11-03) |
| Depends on | nothing |
| Labels | stage-2, ci, docs, follow-up |
| Spec | §9.5 (CI) |
| Status | **done**: PR #74 |

## Goal
Any agent or session working on Listen finds the project's rules in the repo, CI checks what used
to be checked by hand, and the roadmap updates itself.

## Why
A retrospective of the stage 1 and M1-M6 work found the rules living only in one assistant's
private memory, a CI mistake no check could catch (the non-existent `setup-uv@v10` tag), Python
that CI never linted, and roadmap bookkeeping done by hand after every merge.

## What was delivered
- `CLAUDE.md`: navigation pointers only (spec, issue rules, roadmap, commands, review, authorship)
- `CODING_STANDARDS.md`: three judgement rules for review (spoken words stay out of exceptions and
  logs; restructuring says why now; tests touching internals say why)
- `.github/dependabot.yml`: weekly update PRs for the CI actions and the agent's locked libraries
  (its first PR moved `actions/checkout` from v4 to v7, #75)
- CI: actionlint, and ruff over `docs/issues/` too
- `draw_flowchart.py` reads issue states from GitHub and updates the roadmap; the Mermaid graph
  was removed

## Not done (owner's personal files)
Putting `gh` and `uv` on the shell's PATH; scoping the data-analysis section of the global
`CLAUDE.md`.
