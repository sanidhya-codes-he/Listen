# [S2-05] Volume and key primitives

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | S2-04 |
| Labels | stage-2, agent |
| Spec | §3.5 |
| Status | todo |

## Goal
`set_volume`, `change_volume`, `toggle_mute` and a tightly restricted `press_keys`.

## Why
Volume is one of the most common voice commands. `press_keys` is powerful and therefore dangerous,
so its limits are part of the design, not an afterthought.

## Scope
- volume primitives on the master volume; each returns the **previous** state (for exact undo)
- `press_keys`: only with `when_app`; refuses system combinations (`win+r`, `win+x`,
  `ctrl+alt+del`); cannot type free text; validation errors name the reason
- new dependency for volume (`pycaw`) behind the injected `system` object; fakes in tests

## Out of scope
Ducking other apps' sessions (S2-15).

## Done when
- [ ] each refused key combination has a test
- [ ] volume primitives return the previous level and mute state
- [ ] manual check documented in the PR

## How to test
`agent/.venv/Scripts/python -m pytest agent -k "volume or keys" -v`

## Learning
Allowlists versus blocklists; why "can't type free text" matters for safety.
