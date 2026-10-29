# [S5-05] App usage page

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-02, S4-08 |
| Labels | stage-5, web |
| Spec | §8.1 (App usage), §8.3 (charts), prototype `app-usage` |
| Status | todo |

## Goal
Where the owner's time goes: apps and sites, with a full searchable list, comparisons and a
zoomable trend.

## Scope
- total time; top 7 + "Other" bars ("Other" clickable); sites inside the chosen app
- **Every app** list: search, sort, share, change versus the previous period, days used; a row
  selects the app
- trend: one app highlighted, or **compare up to 4** (each its own colour **and** marker shape,
  direct labels; a 5th pick waits; removing keeps the others' colours; zero days dotted at 0)
- trend **zoom**: drag to select days, reset button (daily points kept)
- one y-axis per chart, hover tooltips, a table view for every chart; colour-blind-safe palette
  validated for both themes

## Done when
- [ ] compare rules tested (colour stays with the app, 5th waits)
- [ ] zoom and reset tested; matches the prototype in both themes

## How to test
`cd web; npm run check`

## Learning
Charts with Recharts; accessible colour palettes; state for selections and zoom.
