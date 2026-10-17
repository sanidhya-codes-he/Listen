# agent/  (PROGRAM 1: runs on your laptop)

The local Listen agent: one Python process (Doc 01, Doc 04).
- `listen_agent/` is the code that runs; `tests/` checks it; `pyproject.toml` (added when we build) lists its dependencies.
- Talks to: the server only over HTTPS via `sync/`. Never imports anything from `server/` or `web/`.
- Reads: `../commands/` (your command files) and `../shared/` (the recipe schema).
