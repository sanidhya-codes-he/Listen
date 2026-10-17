# sync/  - laptop <-> cloud (Doc 06)

One POST /v1/sync round trip every 5 minutes and on network reconnect: outbox rows up, deletions/verdicts/pending
edits down, cursor kept in meta. Reads only syncable tables (a test enforces it).
