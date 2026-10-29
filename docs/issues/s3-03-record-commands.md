# [S3-03] Record every command

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S3-02, S2-16 |
| Labels | stage-3, agent |
| Spec | §5.1 (`commands`), §5.2 (privacy rules) |
| Status | todo |

## Goal
Every heard command (run, failed, not matched, low confidence, cancelled) becomes one `commands` row
with its timings and confidences; continuous-mode chatter goes only to the private
`continuous_log`.

## Scope
- a recorder that subscribes to the command events and sends rows to the storage worker
- one row per command: `uuid`, mode, heard, command id, slots, action, result, error, both
  confidences, the four timings, model name
- wake-word / push-to-talk unmatched -> `commands` with `not_matched`; continuous unmatched ->
  `continuous_log`
- tests with fake events and a temp database

## Done when
- [ ] each `result` value has a test row
- [ ] a continuous-mode sentence never appears in `commands`

## How to test
`cd agent; uv run pytest -k recorder -v`

## Learning
Events as the source of records; keeping private and syncable data apart by table.
