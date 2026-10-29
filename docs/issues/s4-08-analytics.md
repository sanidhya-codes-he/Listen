# [S4-08] Analytics and history endpoints

| | |
|---|---|
| Stage | S4 server and sync |
| Depends on | S4-05 |
| Labels | stage-4, server |
| Spec | §7.1 (analytics, history edits), §8.1 (what each page needs) |
| Status | todo |

## Goal
Every number and chart in the web app has an endpoint that returns exactly what the page needs,
for the logged-in user only.

## Scope
- `GET /v1/analytics/summary`, `/apps` (**every** app for the range; the top-7 limit is the web
  app's choice), `/commands` (50 per page, filters: result, mode, command, date range, search),
  `/failed`, `/latency`, `/calibration`, `/calendar?year=`
- `PATCH /v1/commands/{uuid}` (verdict only), `DELETE /v1/commands/{uuid}` (tombstone +
  `change_log`, so the laptop deletes its copy)
- response models fully typed so the OpenAPI description (and the web app's generated types) are
  exact
- seed-data fixtures for tests

## Done when
- [ ] every endpoint: happy path, 401, 422 tests against PostgreSQL
- [ ] a user never sees another user's data (test per endpoint)

## How to test
`cd server; uv run pytest -k analytics -v`

## Learning
SQL aggregation (GROUP BY, date ranges, percentiles); pagination; typed API contracts.
