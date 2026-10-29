# [S5-04] History page

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-02, S4-08 |
| Labels | stage-5, web |
| Spec | §8.1 (History), prototype `history` |
| Status | todo |

## Goal
Every command ever heard, searchable and filterable, with details and the ability to mark right or
wrong and delete.

## Scope
- a plain, dense table: time, heard, command, result, mode, hearing %, match %, response,
  right/wrong, details
- 50 per page (server pagination), search, filters (result, mode, command, date range)
- row details with the 4-stage timing bar
- right/wrong buttons (`PATCH`), **hold-to-delete** (`DELETE`); optimistic update with rollback on error

## Done when
- [ ] filters and pagination tested with the mocked API
- [ ] delete only after a full hold; a failed request restores the row

## How to test
`cd web; npm run check`

## Learning
Server-side pagination; optimistic updates; accessible tables.
