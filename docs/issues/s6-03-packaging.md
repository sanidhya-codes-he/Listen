# [S6-03] Packaging: a real installed app

| | |
|---|---|
| Stage | S6 later |
| Depends on | S2-17 |
| Labels | stage-6, agent |
| Spec | §10 stage 6; stage 1 review (non-editable installs) |
| Status | todo |

## Goal
Listen works when installed normally (not editable), keeps its settings and logs in the user folder,
and starts at Windows login.

## Scope
- settings and logs move to `%APPDATA%\Listen\` (next to the database); first run copies the default
  `settings.yaml` there
- `paths.py` no longer depends on the package's location (fixes the non-editable-install issue
  noted in the stage 1 review)
- a start-at-login option (a Startup folder shortcut to the launcher)

## Done when
- [ ] a non-editable install finds and uses `%APPDATA%\Listen\settings.yaml`
- [ ] tests use a fake `%APPDATA%` (environment variable pointed at `tmp_path`)

## How to test
`cd agent; uv run pytest -k paths -v` plus a manual install check.

## Learning
Where apps keep user data on Windows; editable versus installed packages.
