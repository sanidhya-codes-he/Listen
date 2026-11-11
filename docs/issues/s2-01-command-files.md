# [S2-01] Command files and the recipe schema

| | |
|---|---|
| Stage | S2 voice agent in the terminal |
| Depends on | M2 |
| Labels | stage-2, agent |
| Spec | §3.1, §3.2 (slot names), §3.5 (primitive names), §3.7 (continuous default), §3.8 (routines format), Doc 03 |
| Status | in progress |

## Goal
Commands live in YAML files in `commands/`, every entry is checked against one schema, and
`listen commands check` reports problems with file and line.

## Why
Commands are data, not code (Doc 03): adding "open spotify" must never need a Python change. One
schema (`shared/recipe.schema.json`) is the single definition of a valid command, later reused by
the server and the web form.

## Scope
(updated 2026-11-04 before starting: line numbers settled (a `line` on every parsed mapping), schema
draft and library versions fixed, real file and function names, a `press_keys` safety rule, the
`close_app` default, duplicate ids, a deterministic load order and the exit code; "How to test" now
uses uv)

- `shared/recipe.schema.json` (JSON Schema **draft 2020-12**, `$schema` declared): a root object with
  `targets` (name -> per-verb URLs, `home`), `defaults` (verb -> target), `aliases` (below) and
  `commands`, plus
  `$defs` for `target` and `command`, so one entry can be checked alone. A command has: `id`,
  `patterns` (each `{...}` must be `query`, `target`, `app` or `number`, §3.2), **either** `action`
  + `params` **or** `steps` (each step is `{action, params}`), optional `when_app`, `focus_first`,
  `risk: low|high`, `continuous: allow|confirm|block`, `undo: {keys: ...}`. Unknown keys are refused
  (`additionalProperties: false`), so a typo like `rsik:` is an error, not silently ignored.
  - `action` is an enum of the eight names in §3.5; the schema is where the allowlist first bites
  - **`press_keys` (as `action` or in any step) requires `when_app`** (§3.5), expressed with
    `if/then`; the refused combinations (`win+r`, `win+x`, `ctrl+alt+del`) stay with S2-05, which
    must apply the same check to `undo.keys` and to routine steps
- `core/paths.py`: add `COMMANDS_DIR` (`../commands`) and `RECIPE_SCHEMA` (`../shared/recipe.schema.json`),
  next to `SETTINGS_FILE`; like it, they work from a source checkout (packaging is S6-03)
- `core/yamlfile.py` (M2): make the strict loader return a `dict` subclass with a `.line` (1-based,
  like the editor and like the duplicate-key message) for every mapping. It still equals a plain
  dict, so the settings code and tests are untouched. Say in the PR why this belongs here: S2-01
  is the first caller that needs lines for entries, not only for duplicates.
- `listen_agent/intent/` already exists (S2-03 added `__init__.py` and `app_index.py`).
  `intent/library.py`: load `commands/*.yaml` **sorted by file name** with
  `load_yaml`; validate each target, default and command on its own against its `$defs`;
  **skip invalid entries with a warning `core.yaml:14: commands[2].params: ...`** (file name as M2
  prints it, the line of the entry, the path inside it, no pattern text beyond the schema message);
  if a whole file cannot be parsed (unreadable, broken YAML, duplicate key, top level not a mapping),
  keep the last good version of that file; return one `CommandLibrary` with `targets`, `defaults`,
  `commands` (frozen `Command` dataclasses: file, line, id, patterns, action/params or steps,
  `when_app`, `focus_first`, `risk`, `continuous`, `undo`) and `problems: list[str]` (the same
  messages, so S2-15/S2-16 can show the pop-up with file:line, §9.1). Log through
  `logging.getLogger("intent")`.
  - defaults filled here, not in the schema: `risk: low`; `continuous: allow`, except
    **`close_app` commands default to `risk: high`** (§3.6) **and `continuous: confirm`** (§3.7);
    routines stay `low` and `allow`
  - cross-file rules after merging, each a skipped entry with a warning naming both places:
    duplicate command `id`; duplicate target name (the first file in name order wins);
    a `defaults` entry whose target does not exist
  - order is the order S2-02 uses for "ties go to the earlier entry": sorted file names, then
    position in the file
- hot reload: `reload_if_changed()` compares each file's `st_mtime_ns` and size and the set of files
  (a deleted file's entries are dropped; a new file is added); it builds a new library and swaps it
  in one assignment, so a reader never sees a half-loaded one; returns whether anything changed.
  Called every 2 s by the housekeeping worker in S2-16 (editors save in two steps, so a half-written
  file is common: the "keep last good" rule covers it)
- `__main__.py`: a `commands` subcommand with `check` (S2-02 adds `try` next to it):
  `listen commands check` validates all files, prints each problem, **exits 1 if any** (not 2, which
  argparse uses, 3 `EXIT_FATAL` or 78 `EXIT_BAD_SETTINGS`)
- **app aliases** (spec §3.3: "aliases in the command files"): a top-level `aliases` mapping,
  spoken name -> app name, returned as `CommandLibrary.aliases` for the app index (S2-16 passes it
  in). `core.yaml` ships short names for common apps (`chrome` -> `Google Chrome`, `edge` ->
  `Microsoft Edge`, `code` -> `Visual Studio Code`): the index alone refuses "chrome" (similarity
  0.63, below 0.8). Found in the review of PR #79.
- starter files in `commands/`: `core.yaml` (open, search, close, volume, play), `browser.yaml`
  (targets: google, youtube, github ...), `terminal.yaml`, `media.yaml`, `routines.yaml` (the
  "dsa" routine: see the question below). The repository is public: nothing private in them.
- new dependency: `jsonschema` 4.26.0 (`uv add jsonschema`; it also brings attrs, referencing,
  rpds-py and jsonschema-specifications, all with Windows wheels; `uv.lock` records them)

## Out of scope
Matching sentences (S2-02); running actions (S2-04..06); `browser`/`profile` in routine steps (S6-02);
refusing the dangerous key combinations (S2-05); checking that `params` use only slots present in a
pattern (S2-02: a missing `{target}` is filled from `defaults`, so the matcher is where that is known).

## Done when
- [x] a broken entry is skipped with `core.yaml:14: ...`, the other entries still load
- [x] an unparseable file (and a file with a duplicate key) keeps its last good version in memory
- [x] `listen commands check` exits 0 on the starter files, 1 on a broken copy
- [x] tests: valid file, each kind of invalid entry (unknown key, bad `risk`, unknown action, bad
      slot name, `press_keys` without `when_app`, both `action` and `steps`), duplicate id, defaults
      pointing nowhere, unparseable file, reload on change, deleted file, no half-loaded read
- [x] every primitive name in the schema equals the allowlist in §3.5 (test against a list written
      in the test; S2-04 later adds the check against the real registry)
- [x] the schema itself is valid: `Draft202012Validator.check_schema` in a test
- [x] all existing tests pass without edits (the `.line` change is invisible to settings)

## How to test
```
cd agent
uv run pytest -k "library or recipe or yaml" -v
uv run listen commands check
```

## Decisions (made 2026-11-04)
- **Line numbers: yes.** `yaml.load` gives plain dicts, so M2's `load_yaml` knows no lines except
  for duplicate keys. Spec §3.1 and the done-when promise `file:line`, and "entry #N" is useless in a
  200-line file. Cost: about ten lines in `_StrictLoader.construct_mapping` (a `dict` subclass with
  `.line`). Rejected: parsing a second time with `yaml.compose` (two parses can disagree).
- **JSON Schema draft 2020-12**: current, and `jsonschema` 4.26.0 (PyPI, 2026-01) validates it with
  `Draft202012Validator`.
- **Load order = sorted file names**: makes "earlier entry wins" the same on every run and machine
  (otherwise it depends on directory listing order).
- **Exit code 1** for `check` problems: 2, 3 and 78 are taken (argparse, fatal, bad settings).
- **Dangerous keys**: the schema only makes `when_app` mandatory for `press_keys`; the blocked
  combinations are one runtime check owned by S2-05, so there is one list, not two.

## Decisions (made 2026-11-08, step 3 with the owner)
- **A warning gives the entry's line** (where `- id: ...` starts), not the exact line of the wrong
  key: the owner chose this over per-key lines (option B: about 15 more lines for an exact line
  and a "did you mean"). jsonschema's own messages are translated into plain words where they are
  unreadable (its "not valid under any of the given schemas" dumps the whole entry).
- **Doc 03's fields are in the schema**: a top-level `version: 1` and a command's `url_from`
  (the target's URL for this verb: `url_from: search`); the scope list above had missed them, and
  Doc 03's own example would have been refused.
- **A deleted file's commands disappear** at the next check; a broken file keeps its last good
  version (deleting is deliberate, a broken file is usually a half-saved one).
- **The "dsa" routine** uses placeholders until the owner names the real ones: CLion, LeetCode
  and GeeksforGeeks, editable in `commands/routines.yaml`.

## Decisions (made 2026-11-12, review of PR #85)
- **Per-action defaults live in one table**, `ACTION_DEFAULTS` in `intent/library.py`
  (`close_app`: `risk: high`, `continuous: confirm`); any command overrides them in YAML. A future
  risky primitive is one line there.
- **A target, default or alias reports the line of its key** (the YAML loader now records
  `key_lines` too): still option A, an entry's own line. A command written as plain text instead
  of a mapping still reports its section's line (a limitation: lists don't record item lines).
- **`listen commands check` on a missing folder exits 1** (`<folder>: no such folder`); the agent
  itself still starts with an empty library.

## Learning
JSON Schema; validating data at the edge; "skip the bad, keep the good"; mtime-based reloading; a
parser's source positions (marks).
