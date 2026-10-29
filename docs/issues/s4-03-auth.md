# [S4-03] Authentication: login, sessions, lock-out

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-02 |
| Labels | stage-4, server |
| Spec | §7.1 (auth endpoints), §7.3 (security) |
| Status | todo |

## Goal
The owner logs in with a username and password; the browser keeps a secure session cookie for 30
days; guessing passwords is blocked.

## Scope
- `python -m app.cli create-user` (no sign-up endpoint); passwords hashed with **Argon2**
- `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me`
- session cookie: random id (only its hash stored), `HttpOnly`, `Secure`, `SameSite`, 30 days;
  expired sessions cleaned up during requests (no timed jobs on free hosting)
- lock-out: **5 failures in 15 minutes** per username -> refused for 15 minutes (counted in the
  database); one generic error message (never "user not found")
- CORS only for `WEB_APP_ORIGIN`

## Done when
- [ ] tests: happy path, wrong password, lock-out and its end, logout, expired session, 401 shape
- [ ] no password or cookie value ever appears in logs (test)

## How to test
`cd server; uv run pytest -k auth -v`

## Learning
Password hashing; cookies and their flags; brute-force protection; CORS.
