# [S5-08] Devices and settings page

| | |
|---|---|
| Stage | S5 web app |
| Depends on | S5-02, S4-04 |
| Labels | stage-5, web |
| Spec | §8.1 (Devices & settings), prototype `devices` |
| Status | todo |

## Goal
Manage the laptop connection and the web app's own settings.

## Scope
- devices with last sync; create a token shown once on the **tear-off ticket**; **hold-to-revoke**
- current session and log out
- theme: Windows / Light / Dark (shared with the header switch, saved in `localStorage`)

## Done when
- [ ] the token is shown once and never fetchable again (test)
- [ ] revoke only after a full hold; matches the prototype in both themes

## How to test
`cd web; npm run check`

## Learning
Showing secrets safely in a UI; destructive actions without dialogs (hold-to-confirm).
