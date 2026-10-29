# [S3] Stage 3: usage agent and local SQLite

| | |
|---|---|
| Kind | stage issue (milestone "Stage 3: usage and local data") |
| Depends on | S1; S3-03 also needs S2-16 |
| Labels | stage-3 |
| Spec | §5 (local data), §9.1 (database failures) |
| Status | todo |

## Goal
Every command and every minute of app and site use is stored on the laptop in SQLite, private data
is purged after 30 days, and the owner can review commands and mark them right or wrong.

## Tasks (sub-issues)
S3-01 storage engine -> S3-02 tables -> S3-03 record commands, S3-04 usage tracker -> S3-05 sites,
S3-06 roll-up and purge, S3-07 review and "that's wrong" -> S3-08 Doc 12

## Done when
- [ ] all task issues closed
- [ ] after a day of normal use, `usage_daily` shows the right apps and sites with plausible times
- [ ] raw window titles exist only in `app_sessions`; nothing private in syncable tables
- [ ] a damaged database file is renamed and a fresh one starts, with a pop-up
- [ ] CI green; Doc 12 written
