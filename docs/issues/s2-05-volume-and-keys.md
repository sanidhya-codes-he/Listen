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
(updated 2026-11-07 after S2-04 merged (PR #80): the registry, the `system` object and the privacy
rule now exist)
- each primitive is one file in `actions/primitives/` with `@primitive("name", params={"level": int})`
  (a dict of parameter name -> type; `run()` refuses missing, extra and wrong-typed ones before the
  function is called); the file returns a value and takes `system` first, like `launch_app.py`
- volume primitives on the master volume; each returns the **previous** state (for exact undo)
- `press_keys`: only with `when_app`; refuses system combinations (`win+r`, `win+x`,
  `ctrl+alt+del`); cannot type free text; validation errors name the reason, as an `ActionError`
  (S2-04's rule: messages never quote spoken words; a refused combination comes from a command
  file, not speech, so naming it is fine)
- the real calls are new methods on `WindowsSystem` (`actions/windows.py`) and on `FakeSystem`
  (`tests/actions/conftest.py`, which records each call in `.calls`); the primitives never touch
  Windows themselves
- new dependency for volume: **pycaw** (latest 20260927, released 2026-09-26; needs `comtypes>=1.4.8`
  and `psutil>=5.9.0`, Python 3.10+), so `uv add pycaw` adds three packages. Import it inside
  `WindowsSystem`, not at the top of a primitive, so tests with `FakeSystem` never load it. S2-04
  used `ctypes` only to keep `uv.lock` clear of #79; that reason is gone (pywin32 is merged)
- `when_app` names an app through the app index like the other app primitives
  (`installed_app()` in `actions/apps.py`)

## Out of scope
Ducking other apps' sessions (S2-15).

## Done when
- [ ] each refused key combination has a test
- [ ] volume primitives return the previous level and mute state
- [ ] manual check documented in the PR

## How to test
```
cd agent
uv run pytest tests/actions -k "volume or keys" -v
```

## Learning
Allowlists versus blocklists; why "can't type free text" matters for safety.
