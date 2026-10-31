# [S2-08] Switch from pip + venv to uv

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | M1 |
| Labels | stage-2, agent, ci |
| Spec | §9.5 (CI) |
| Status | in progress |

## Goal
Every install, on the laptop and in CI, uses exactly the versions recorded in `agent/uv.lock`.

## Why
From S2-09 on, big interlinked libraries arrive (faster-whisper with ctranslate2, openWakeWord with
onnxruntime, numpy, audio libraries). Without a lock file, a silent upgrade of any of them could
change speed or behaviour between the laptop and CI. Decided 2026-10-29: pip until now, uv right
before audio.

## Scope
(updated 2026-10-31 before starting: versions checked that day; M1's pins decided)
- install uv **0.13.6** on the laptop (`winget install --id astral-sh.uv`), the newest release
- `agent/.python-version` containing `3.11` (`uv python pin 3.11`): uv reads it on the laptop
  and in CI, so the Python version is written in one place
- `uv lock` in `agent/` -> commit `agent/uv.lock`; `uv sync --extra dev` replaces
  `pip install -e "agent[dev]"`. uv reuses the same `agent/.venv` folder, so the old command
  `agent/.venv/Scripts/python -m pytest agent` keeps working (M2-M6 need no changes); `uv sync`
  removes packages that are not in the lock (e.g. the one-off `actionlint-py`)
- `ci.yml`: replace `setup-python` + pip with `astral-sh/setup-uv@v10` (`version: "0.13.6"`,
  `enable-cache: true`, cache keyed on `agent/uv.lock`); then `uv sync --locked --extra dev`
  (`--locked` fails if `uv.lock` is out of date with `pyproject.toml`), `uv run ruff check .`,
  `uv run pytest`, all in `agent/`
- **keep M1's exact pins** (`pytest==9.2.0`, `ruff==0.17.3`): the lock pins everything else; the
  `==` pins mark these tool versions as a deliberate choice, and `docs/cheatsheet.md` already says
  how to upgrade them (now: change the pin, then `uv lock`)
- update `agent/README.md`, `docs/cheatsheet.md` (uv commands, adding a dependency with `uv add`)

## Out of scope
Server and web (they start on uv directly in S4-01 / their own tools in S5-01). Upgrading the
other actions (`actions/checkout` is at v7 upstream; we use v4): a separate small issue if wanted.

## Done when
- [ ] `uv sync --extra dev` + `uv run pytest` passes on the laptop (71 tests)
- [ ] CI green with uv; CI time noted before (about 30 s for the agent job) and after
- [ ] `listen.exe` still created and working (`uv run listen --version`)
- [ ] `uv.lock` and `.python-version` committed; `.venv` still git-ignored

## How to test
```
cd agent
uv sync --extra dev
uv run ruff check .
uv run pytest
uv run listen --version
```

## Learning
Lock files and resolvers; why a lock file is committed while `.venv` is not; `uv sync --locked`
as a CI guard; one source of truth for the Python version.
