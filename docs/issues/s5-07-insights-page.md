# [S5-07] Insights page

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-02, S4-08 |
| Labels | stage-5, web |
| Spec | §8.1 (Insights), §8.3 (charts), prototype `insights` |
| Status | todo |

## Goal
How well Listen is working: activity over the year, success rate, speed, how trustworthy the
confidence scores are, and the sentences it failed on.

## Scope
- activity calendar with year stats; commands per day; success rate over time
- latency: stacked bars of the 4 stages with the 1.5 s line
- calibration: histograms of confidence for right versus wrong guesses, threshold marked
- failed sentences with "Make it a command" (opens the guided form, S5-06)
- every chart: a one-line takeaway and a Table view; status colours always with an icon and a word

## Done when
- [ ] each chart has a table view and passes the palette check
- [ ] matches the prototype in both themes

## How to test
`cd web; npm run check`

## Learning
Histograms; stacked bars; reading calibration (are the thresholds right?).
