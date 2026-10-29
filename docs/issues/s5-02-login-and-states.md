# [S5-02] Login page and the four page states

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-01, S4-03 |
| Labels | stage-5, web |
| Spec | §8.1 (Login), §8.2 (states) |
| Status | todo |

## Goal
The owner can log in and out, and every page has a consistent look while loading, while the free
server wakes up, on error, and when there is no data yet.

## Scope
- Login page: username, password, one generic error, lock-out message, no Dock
- shared state components: Loading (page-shaped skeletons), Waking up (server starting, elapsed
  timer), Error (what failed, "nothing is lost", Try again, request id), Empty (first day: example
  sentences, "Connect your laptop")
- component tests with the mocked API for each state

## Done when
- [ ] login, wrong password, lock-out and logout tested with MSW
- [ ] each state component tested; looks match the prototypes in both themes

## How to test
`cd web; npm run check`

## Learning
Forms; HTTP-only cookies from the browser's side; designing for slow and failing networks.
