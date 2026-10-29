# [S4-01] Server scaffolding and the CI server job

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S2-08 |
| Labels | stage-4, server, ci |
| Spec | §7 (intro), §7.4 (errors), §9.2 (server logs), §9.5 (CI) |
| Status | todo |

## Goal
An empty but real FastAPI server: health endpoint, one error shape, request ids, settings from
environment variables, tests against PostgreSQL in CI.

## Scope
- `server/pyproject.toml` (managed with uv, like the agent), package `app/`
- `GET /v1/health`; interactive docs at `/docs`
- one error shape `{ "error", "message", "request_id" }`; 500 -> generic message, traceback only in
  the log; database unreachable -> 503
- settings from environment variables (`DATABASE_URL`, `SESSION_SECRET`, `WEB_APP_ORIGIN`),
  `server/.env.example` listing the names; `server/.env` git-ignored
- logs to stdout; never transcripts, passwords or tokens
- `ci.yml`: the `server` job on `ubuntu-latest` with a `postgres:16` service container
- local PostgreSQL for development (decide below)

## Done when
- [ ] `uv run uvicorn app.main:app --reload` serves `/docs`
- [ ] error-shape tests (404, 422, 500, 503)
- [ ] CI: agent job and server job both green

## How to test
```
cd server
uv run pytest
uv run uvicorn app.main:app --reload
curl.exe -s http://localhost:8000/v1/health
```

## Open decisions
- Local PostgreSQL: Docker Desktop, or a native Windows install.

## Learning
Web servers versus apps (uvicorn and FastAPI); environment variables for secrets; CI service
containers.
