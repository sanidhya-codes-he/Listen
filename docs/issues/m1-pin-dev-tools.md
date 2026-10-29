# [M1] Pin ruff and pytest to exact versions

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, ci, follow-up |
| Spec | §9.5 (CI) |
| Status | todo |

## Goal
CI's verdict only changes when our code changes, never because a tool released a new version.

## Why
`dev = ["pytest>=8.0", "ruff>=0.6"]` installs the newest versions on every CI run. A new ruff release
can add a check and turn CI red on a commit that only touched the README.

## Scope
- `agent/pyproject.toml`: `dev = ["pytest==9.1.1", "ruff==0.17.1"]` (the versions installed today;
  confirm with `agent/.venv/Scripts/python -m pip show ruff pytest`)
- `docs/cheatsheet.md`: a line on how to upgrade a pinned tool on purpose

## Out of scope
Pinning runtime libraries (pyyaml): the uv lock file (S2-08) pins everything.

## Done when
- [ ] both tools pinned with `==`
- [ ] reinstall works: `agent/.venv/Scripts/python -m pip install -e "agent[dev]"`
- [ ] `ruff check agent` and `pytest agent` pass locally and in CI

## How to test
```
agent/.venv/Scripts/python -m pip install -e "agent[dev]"
agent/.venv/Scripts/ruff --version
agent/.venv/Scripts/python -m pytest agent
```

## Learning
Version numbers (MAJOR.MINOR.PATCH), specifiers (`>=`, `==`, `~=`), why tools are pinned.
This is a good first issue to do end to end yourself: branch, edit, commit, push, PR.
