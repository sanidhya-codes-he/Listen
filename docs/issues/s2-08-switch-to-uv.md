# [S2-08] Switch from pip + venv to uv

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | M1 |
| Labels | stage-2, agent, ci |
| Spec | §9.5 (CI) |
| Status | todo |

## Goal
Every install, on the laptop and in CI, uses exactly the versions recorded in `agent/uv.lock`.

## Why
From S2-09 on, big interlinked libraries arrive (faster-whisper with ctranslate2, openWakeWord with
onnxruntime, numpy, audio libraries). Without a lock file, a silent upgrade of any of them could
change speed or behaviour between the laptop and CI. Decided 2026-10-29: pip until now, uv right
before audio.

## Scope
- install uv on the laptop (`winget install --id astral-sh.uv`)
- `uv lock` in `agent/` -> commit `agent/uv.lock`; `uv sync --extra dev` replaces
  `pip install -e "agent[dev]"`; recreate `agent/.venv` with uv
- `ci.yml`: the official `astral-sh/setup-uv` action, `uv sync --extra dev`, `uv run ruff check`,
  `uv run pytest`
- update `agent/README.md`, `docs/cheatsheet.md`, and the "How to test" commands in every later
  issue file (rule: update before starting)
- remove the exact pins from M1 if the lock file now covers them (keep or drop: decide here)

## Out of scope
Server and web (they start on uv directly in S4-01 / their own tools in S5-01).

## Done when
- [ ] fresh clone + `uv sync --extra dev` + `uv run pytest` passes on the laptop
- [ ] CI green with uv; CI time noted before and after
- [ ] `listen.exe` still created and working

## How to test
```
cd agent
uv sync --extra dev
uv run pytest
uv run listen --version
```

## Learning
Lock files; resolvers; why a lock file is committed while `.venv` is not.
