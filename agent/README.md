# agent/  (PROGRAM 1: runs on your laptop)

The local Listen agent: one Python process (Doc 01, Doc 04).
- `listen_agent/` is the code that runs; `tests/` checks it; `pyproject.toml` (added when we build) lists its dependencies.
- Talks to: the server only over HTTPS via `sync/`. Never imports anything from `server/` or `web/`.
- Reads: `../commands/` (your command files) and `../shared/` (the recipe schema).

## Set up (once)

Install [uv](https://docs.astral.sh/uv/) (`winget install --id astral-sh.uv`), then in `agent/`:

```
uv sync --extra dev
```

This creates `agent/.venv` with Python 3.11 (from `.python-version`) and installs exactly the
versions recorded in `uv.lock`, plus Listen itself in editable mode (code changes apply without
reinstalling). In PyCharm, choose `agent/.venv/Scripts/python.exe` as the project interpreter.

## Every day (in `agent/`)

```
uv run pytest            # run the tests
uv run ruff check .      # lint: likely mistakes and import order
uv run listen run        # start the agent (Ctrl+C stops it)
uv add <library>         # add a dependency: updates pyproject.toml and uv.lock, installs it
```

All project commands (tests, lint, git, tools): [../docs/cheatsheet.md](../docs/cheatsheet.md).
