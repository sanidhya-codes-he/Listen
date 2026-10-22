# agent/  (PROGRAM 1: runs on your laptop)

The local Listen agent: one Python process (Doc 01, Doc 04).
- `listen_agent/` is the code that runs; `tests/` checks it; `pyproject.toml` (added when we build) lists its dependencies.
- Talks to: the server only over HTTPS via `sync/`. Never imports anything from `server/` or `web/`.
- Reads: `../commands/` (your command files) and `../shared/` (the recipe schema).

## Set up (once)

```
python -m venv agent/.venv
agent/.venv/Scripts/python -m pip install -e "agent[dev]"
```

`-e` (editable) means the installed package points at this folder, so code changes apply without
reinstalling. In PyCharm, choose `agent/.venv/Scripts/python.exe` as the project interpreter.

## Every day

```
agent/.venv/Scripts/python -m pytest agent    # run the tests
agent/.venv/Scripts/ruff check agent          # lint: likely mistakes and import order
agent/.venv/Scripts/listen run                # start the agent (Ctrl+C stops it)
```

All project commands (tests, lint, git, tools): [../docs/cheatsheet.md](../docs/cheatsheet.md).
