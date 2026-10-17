# server/  (PROGRAM 2: runs in the cloud)

FastAPI + PostgreSQL (Doc 07). `app/` is the code; `tests/` checks it.
Talks to: nobody - the laptop and the web app call IT. Never imports from `agent/` or `web/`.
Secrets come from environment variables (server/.env locally, never committed).
