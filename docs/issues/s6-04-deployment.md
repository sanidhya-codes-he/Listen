# [S6-04] Deployment: server and web app online

| | |
|---|---|
| Stage | S6 later |
| Depends on | S4-09, S5-10 |
| Labels | stage-6, server, web, ci |
| Spec | §7 (free-tier hosting), §7.3 (secrets, CORS), §10 stage 6 |
| Status | todo |

## Goal
The server, its database and the web app run on free hosting, and the laptop syncs to them.

## Scope
- server hosting (free tier; may sleep, 20 to 50 s wake), managed PostgreSQL
- web app static hosting; `WEB_APP_ORIGIN` set so CORS allows only it; HTTPS everywhere
- secrets only in the hosts' secret settings (never in the repo)
- optional: a GitHub Actions deploy job after CI passes on `main`
- the owner's account created with `python -m app.cli create-user` on the hosted server

## Done when
- [ ] the laptop syncs to the hosted server; the web app works from its URL
- [ ] the "waking up" state appears when the server was asleep

## How to test
Manual: `curl.exe -s https://<server>/v1/health`, then log in on the web app.

## Open decisions
- Hosts: chosen when this issue starts (free tiers change often).

## Learning
Deploying; environment configuration; secrets management; continuous deployment.
