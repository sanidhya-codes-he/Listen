# [S3-07] Review list and "that's wrong"

| | |
|---|---|
| Stage | S3 usage agent and local SQLite |
| Depends on | S3-03 |
| Labels | stage-3, agent |
| Spec | §5.4 |
| Status | todo |

## Goal
The owner can mark commands right or wrong, by voice right after a mistake or later in a review
list, producing the data that calibrates the thresholds.

## Scope
- voice: "that's wrong" / "wrong" / "that was wrong" marks the most recent non-meta command within
  **60 s** (`verdict=wrong`, `verdict_source=voice`), "done" chime, pop-up naming the command; it does
  not undo; it is a meta-command (never becomes "last command", never touches the undo slot)
- `listen review --last 20`: `[r]ight / [w]rong / [d]elete / skip` per command; delete sets
  `deleted_at` (tombstone, removed after the server confirms in S4)
- a "that's wrong" command entry in the starter command files

## Done when
- [ ] 60 s window tested with the fake clock; meta-command rules tested
- [ ] review updates `verdict`, `verdict_source=review`, `updated_at`

## How to test
```
cd agent
uv run pytest -k "review or wrong" -v
uv run listen review --last 5
```

## Learning
Meta-commands; soft deletes (tombstones); collecting labelled data for calibration.
