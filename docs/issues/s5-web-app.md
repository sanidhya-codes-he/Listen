# [S5] Stage 5: web app and AI command builder

| | |
|---|---|
| Kind | stage issue (milestone "Stage 5: web app") |
| Depends on | S4 (API); S5-09 depends on S2 only |
| Labels | stage-5 |
| Spec | §8 (web app), §3.10 (command builder), Doc 08, `docs/design/prototypes/` |
| Status | todo |

## Goal
The analytics web app from the approved prototypes (7 pages, light and dark themes, Dock
navigation), using only the public API, plus the Gemini-powered command builder on the laptop.

## Tasks (sub-issues)
S5-01 scaffolding -> S5-02 login and page states -> S5-03 Overview, S5-04 History, S5-05 App usage,
S5-06 Commands, S5-07 Insights, S5-08 Devices; S5-09 AI command builder -> S5-10 Doc 14

## Done when
- [ ] all task issues closed
- [ ] every page matches its prototype in both themes and handles loading / waking / error / empty
- [ ] generated API types are up to date (CI check)
- [ ] CI `web` job green (types, tests)
