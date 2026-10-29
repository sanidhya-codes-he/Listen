# [S5-03] Overview page

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-02, S4-08 |
| Labels | stage-5, web |
| Spec | §8.1 (Overview), §8.3 (calendar), prototype `overview` |
| Status | todo |

## Goal
The first page after login, as in the approved prototype: the "Listen" title with a summary line,
the activity calendar, stat cards and the last 8 commands.

## Scope
- TechText "Listen" hero (capital L) + summary line; last-synced status
- activity calendar (custom SVG heatmap): grey for zero days, 4 blue quartile steps; light mode
  darker = more, dark mode brighter = more (dark zero `#2A3440`, steps `#1C5CAB`, `#2A78D6`,
  `#5598E7`, `#9EC5F4`)
- InfiniteSpiral stat cards: commands today, success rate, top app, median response, top site,
  no-match count, streak, each with change versus the 7-day average
- FlowingMenu last 8 commands; a click opens History

## Done when
- [ ] matches the prototype in both themes; all four states handled
- [ ] calendar colours tested for both themes; component tests with the mocked API

## How to test
`cd web; npm run check; npm run dev`

## Learning
SVG drawing; quartiles; animation and `prefers-reduced-motion`.
