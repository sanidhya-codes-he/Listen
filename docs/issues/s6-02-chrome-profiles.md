# [S6-02] Chrome profiles in routines

| | |
|---|---|
| Stage | S6 later |
| Depends on | S2-06 |
| Labels | stage-6, agent |
| Spec | §3.8 (later: `browser` and `profile` on `open_url` steps) |
| Status | todo |

## Goal
A routine can open a URL in a specific Chrome profile (e.g. "work" versus "personal").

## Scope
- a fixed list of defined profiles in the command files; an `open_url` step may name `browser` and
  `profile` from that list only
- only the profile flag is passed to Chrome, never arbitrary arguments (safety)
- schema update in `shared/recipe.schema.json`

## Done when
- [ ] an unknown profile is rejected by validation
- [ ] tests check the exact command line built (with a fake system)

## How to test
`cd agent; uv run pytest -k profile -v`

## Learning
Extending a schema without breaking existing files; passing arguments to programs safely.
