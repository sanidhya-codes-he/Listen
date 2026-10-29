# [M2] Strict YAML loading: refuse duplicate keys

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, follow-up |
| Spec | §3.1 (command files are validated), §11 (settings) |
| Status | todo |

## Goal
A YAML file with the same key twice is refused with a message naming the key and line, in
`settings.yaml` now and in every command file later.

## Why
PyYAML's `safe_load` silently keeps the **last** duplicate. Writing `thresholds:` twice throws away
the first block and its values quietly return to defaults: exactly the silent fallback stage 1's
settings rules exist to prevent.

## Scope
- new `agent/listen_agent/core/yamlfile.py`: `load_yaml(path) -> object`, using a `SafeLoader`
  subclass that raises on a duplicate mapping key (`"<file>:<line>: duplicate key 'thresholds'"`);
  also owns the UTF-8 / BOM / unreadable-file handling now in `settings.py`
- `settings.py` uses `load_yaml` (its behaviour and messages otherwise unchanged)
- tests: duplicate at the top level, duplicate inside a section, valid file unchanged

## Out of scope
Command-file validation (S2-01 will reuse `load_yaml`).

## Done when
- [ ] `thresholds:` written twice stops start-up: `Can't start: settings.yaml:9: duplicate key 'thresholds'`
- [ ] all existing settings tests still pass
- [ ] new tests seen failing first, then passing

## How to test
`agent/.venv/Scripts/python -m pytest agent -k "settings or yaml" -v`

## Learning
How a YAML parser builds a dict; subclassing a library class to change one behaviour; why one shared
loader beats two copies.
