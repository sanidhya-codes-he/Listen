# [M2] Strict YAML loading: refuse duplicate keys

| | |
|---|---|
| Stage | S2 (follow-up from the stage 1 review) |
| Depends on | S1 |
| Labels | stage-2, agent, follow-up |
| Spec | §3.1 (command files are validated), §11 (settings) |
| Status | in progress |

## Goal
A YAML file with the same key twice is refused with a message naming the key and line, in
`settings.yaml` now and in every command file later.

## Why
PyYAML's `safe_load` silently keeps the **last** duplicate. Writing `thresholds:` twice throws away
the first block and its values quietly return to defaults: exactly the silent fallback stage 1's
settings rules exist to prevent.

## Scope
(updated 2026-10-31 before starting: error type, line numbers and missing files decided)
- new `agent/listen_agent/core/yamlfile.py`: `load_yaml(path) -> object`, using a `SafeLoader`
  subclass that raises on a duplicate mapping key; also owns the UTF-8 / BOM / unreadable-file /
  broken-YAML handling now in `settings.py`
- errors are a new `YamlFileError` whose message starts with the file name:
  `settings.yaml:9: duplicate key 'thresholds'`; the line is the **second** occurrence (the one to
  delete), counted from 1 like an editor; the unreadable and broken-YAML messages stay word for
  word as today (`settings.yaml: can't read it (...); save it as UTF-8`,
  `settings.yaml: not valid YAML (...)`)
- `load_yaml` does **not** treat a missing file as empty: "missing means defaults" is a settings
  rule, so `load_settings` keeps its own `exists()` check (a missing command file is an error)
- `settings.py` uses `load_yaml` and turns `YamlFileError` into `SettingsError`, so
  `Can't start: ...` and exit code 2 are unchanged
- tests: duplicate at the top level, duplicate inside a section, line number, valid file unchanged,
  unreadable file; all existing settings tests pass without edits

## Out of scope
Command-file validation (S2-01 will reuse `load_yaml`).

## Done when
- [x] `thresholds:` written twice stops start-up: `Can't start: settings.yaml:9: duplicate key 'thresholds'`
- [x] all existing settings tests still pass
- [x] new tests seen failing first, then passing

## How to test
`agent/.venv/Scripts/python -m pytest agent -k "settings or yaml" -v`

## Learning
How a YAML parser builds a dict; subclassing a library class to change one behaviour; why one shared
loader beats two copies.
