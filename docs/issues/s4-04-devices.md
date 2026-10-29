# [S4-04] Devices and device tokens

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-03 |
| Labels | stage-4, server |
| Spec | §7.1 (devices), §7.3 (device tokens) |
| Status | todo |

## Goal
The owner creates a token for the laptop (shown once), can list and revoke devices, and a token only
ever allows syncing.

## Scope
- `POST /v1/devices` (token shown once), `GET /v1/devices`, `DELETE /v1/devices/{id}`
- tokens stored **hashed**, no expiry, revocable
- a device-token check usable **only** by `POST /v1/sync` (least privilege): a token on any other
  endpoint is a 401
- the agent side: `listen device add` stores the token in `agent/.env` (never committed)

## Done when
- [ ] tests: create, list, revoke, a revoked token gets 401, a token on a non-sync endpoint gets 401

## How to test
`cd server; uv run pytest -k devices -v`

## Learning
Tokens versus sessions; least privilege; showing a secret exactly once.
