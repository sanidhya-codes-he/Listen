# [S3-05] Sites from browser titles

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S3-04, M2 |
| Labels | stage-3, agent |
| Spec | §5.5 (site extraction), §11 (site rules) |
| Status | todo |

## Goal
Time in a browser is split by site ("youtube.com", "Google Search"), without ever storing raw titles
anywhere except the private `app_sessions`.

## Scope
- strip the browser suffix (" - Google Chrome", " - Microsoft Edge", ...)
- a built-in rules table, extendable by `agent/site_rules.yaml` (loaded with `load_yaml` from M2):
  "... - YouTube" -> "youtube.com", "... - Google Search" -> "Google Search"
- anything unrecognised -> "Other sites"
- table-driven tests with real-looking titles

## Done when
- [ ] at least 20 title examples in the test table
- [ ] a raw title never reaches `usage_daily` (test)

## How to test
`cd agent; uv run pytest -k site -v`

## Learning
Rules as data; privacy by reduction (keep only what is needed).
