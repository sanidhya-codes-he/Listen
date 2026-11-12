# Record: S2-01 Command files and the recipe schema (#16, PR #85)

Written 2026-11-12, the day PR #85 merged (step 11 of the pipeline).

**Result.** Commands now live in YAML files in `commands/`, checked entry by entry against one schema
(`shared/recipe.schema.json`, JSON Schema draft 2020-12). A bad entry is skipped with a
`file:line` warning; a file that cannot be parsed keeps its last good version; `listen commands
check` prints every problem and exits 1 if there is any. PR #85 opened 2026-11-10, two reviews,
merged 2026-11-12 12:28; issue #16 closed the same minute. Tests: 175 passed at merge, `ruff check`
clean, CI `agent` green.

**How to read this.** Times are IST (UTC+5:30), as in the commit log; GitHub's UTC stamps are
converted. Sources in brackets: *file* = `docs/issues/s2-01-command-files.md`, *PR* = the PR #85
description, *R1*, *R2* = the two reviews, *C1*, *C2* = the two owner comments with the fixes.
**Gap:** the step 3 design conversation (2026-11-08) and the step 6 and 7 conversations are not
kept anywhere I could read. What is known about them comes from the issue file, the PR text and the
reviews, so the record has no conversation timestamps.

## Before the build

| When | What | Source |
|---|---|---|
| 2026-11-04 | Issue file refreshed before starting: line numbers settled (a `line` on every mapping), draft 2020-12 and `jsonschema` 4.26.0 fixed, real file names, the `press_keys` safety rule, the `close_app` default, duplicate ids, sorted load order, exit code 1. "How to test" moved to uv. | file, Scope note and "Decisions (made 2026-11-04)" |
| 2026-11-05 16:38 | The review of PR #79 (S2-03) found that the app index alone refuses "chrome" (similarity 0.63, below the 0.8 line). **Added to S2-01:** a top-level `aliases` mapping (`chrome` -> `Google Chrome`). Commit `79896d7` refreshes the file. | file, scope line "app aliases"; git |

## The build (2026-11-08)

| When | What | Source |
|---|---|---|
| 15:23 | Step 3, the owner designs with the assistant. Issue file updated at the start (`ca777a1`). **Decision:** a warning gives the line where the entry starts, not the wrong key's own line. The owner chose this over option B (about 15 more lines for exact lines and "did you mean"). | file, "Decisions (made 2026-11-08)"; PR |
| 15:23 | **Correction found while designing:** the first draft of the issue missed Doc 03's `version: 1` and a command's `url_from`; Doc 03's own example would have been refused by the schema. Both added. | file; PR |
| 15:23 | **Decisions:** a deleted file's commands disappear, a broken file keeps its last good version. The "dsa" routine ships with placeholders (CLion, LeetCode, GeeksforGeeks) until the owner names the real ones. | file |
| 15:24 | `961b8bb`: the strict YAML loader (M2's file) returns `LinedDict`, a `dict` subclass with `.line`. Reason, stated in the PR: S2-01 is the first caller needing a line for every entry. Rejected: parsing twice with `yaml.compose` (two parses can disagree). Settings code and tests untouched. | git; PR |
| 15:25 | `f7ab3ce`: the schema, `COMMANDS_DIR` and `RECIPE_SCHEMA` in `core/paths.py`, `jsonschema` 4.26 (the lock also brings attrs, referencing, rpds-py, jsonschema-specifications). | git; PR |
| 15:28 | `c9edbe1`: `CommandFiles` in `intent/library.py`: per-entry checks, skip with `file:line`, last good version, `reload_if_changed()`, cross-file rules (duplicate id, duplicate target, default pointing nowhere). | git; PR |
| 15:30 | `dc296bb`: `listen commands check`, exit 1 (2, 3 and 78 are taken). | git; PR |
| 15:31 | `05b7a75`: starter files `core`, `browser`, `media`, `terminal`, `routines`. `d9c94b1`: done-when boxes ticked. | git; file |

The seven commits are 8 minutes apart, so commit times do not show the order the work was done in.
The PR says it was built test-first; I could not check that from the history.

**Manual check (PR, date not stated).** In `commands/core.yaml` `launch_app` was changed to
`launch_apps`. `listen commands check` printed `core.yaml:12: command 'open': action: 'launch_apps'
is not an allowed action` and `13 commands, 5 targets in 5 files: 1 problem`, exit 1; the other 13
commands still loaded. The file was restored with `git restore`. **Note:** `uv` was not installed on
the owner's machine at that point, so the check ran as `agent\.venv\Scripts\listen`, while the issue
file's "How to test" says `uv run`.

## The PR

| When | What | Source |
|---|---|---|
| 2026-11-10 12:31 | PR #85 opened. Tests at that point: 167 passed. Limitations listed: the entry's line, not the key's; dsa placeholders; `params` vs pattern slots left to S2-02; dangerous keys to S2-05; the real primitive registry to S2-04; nothing calls `reload_if_changed()` until S2-16. | PR |
| 2026-11-12 01:04 | **R1** at `d9c94b1`, verdict *with fixes*. Checks: 167 passed, ruff clean, `commands check` on the starters: `14 commands, 5 targets in 5 files: no problems`. Two deliberate breakages each failed tests; **two guards failed none** when removed (fixes 2 and 3). | R1 |
| | Fix 1 (Important): the issue wrote only `risk: low`, but spec 3.6 says closing apps is high risk, so "close chrome" would pass the same thresholds as "volume up" once S2-07 lands. Proposed an `ACTION_DEFAULTS` table. | R1 |
| | Fix 2 (Important): `skipped.update(error.path)` had no test. Without it, a file containing only `commands:` (a half-typed save) crashed the loader with `TypeError: 'NoneType' object is not iterable`. | R1 |
| | Fix 3: `del self._last_good[gone]` had no test. Without it a deleted file, re-created broken, brought its old commands back. | R1 |
| | Fix 4: `listen commands check` on a missing folder said `0 commands, 0 targets in 0 files: no problems` and exited 0, so a moved checkout looked fine. | R1 |
| | Fix 5: scalar entries had no `.line`, so a wrong second default reported `a.yaml:4` instead of `:5`. The reviewer offered two ways (record key lines, or list it as a limitation) and recommended the first. | R1 |
| | Left out on purpose: multi-line YAML parse errors (M2's `load_yaml`; matters in the S2-15 pop-up), a pattern of only spaces (S2-02), raw jsonschema messages that remain. | R1 |
| 01:10 | `5e1703d` applies the five fixes. | git; C1 |
| 01:15 | **Owner's rule, `ffd1d57`:** confirmation follows risk, not the action. Every `risk: high` command defaults to `continuous: confirm`; `ACTION_RISK = {"close_app": "high"}` only says which actions are high risk by default. This replaced R1's `ACTION_DEFAULTS` table five minutes after it landed. A new risky command now needs only `risk: high` in YAML. | git; C1; file, "Decisions (made 2026-11-12)" |
| 01:31 | **C1**: table of the five fixes with evidence, each guard shown to fail when removed. Suite: 174 passed. One limitation: a plain-text command still reports its section's line. | C1 |
| 11:59 | **R2** on `d9c94b1..ffd1d57`, verdict *Ready to merge: yes*. All five fixed (fix 5 partly), each guard fails a test when removed. Two Minors: (1) a plain-text command reported line 1, not the `commands:` line as the issue file says; (2) spec 3.7 item 3 and `s2-07-thresholds.md:23` still said "close_app commands default to confirm", the old rule, and S2-07 could have restated it in a second place. | R2 |
| 12:02 | `a6b40c9` fixes both: the plain-text command reports the `commands:` line (new test, failed first with `a.yaml:1`, passes with `a.yaml:4`); spec 3.7 and S2-07 now say every high-risk command asks first, and S2-07 reads the defaults from the command library. 175 passed. | git; C2 |
| 12:10 | **C2** posted. CI `agent`: two runs, both SUCCESS at 12:10. | C2; CI |
| 12:28 | Merged (`19c6fbd`). Issue #16 closed. | git; GitHub |
| after | `20032e4`: roadmap shows S2-01 done and S2-02 ready. | git |

## Failures and corrections, in one place

1. **The schema would have refused Doc 03's own example** (`version`, `url_from` missing). Found in step 3, before any code.
2. **Closing an app was low risk.** Found by R1; the first fix (a per-action table) was replaced within minutes by the owner's risk-based rule.
3. **Two safety guards had no test** (empty section, forgotten deleted file). Found by R1 by removing each line and re-running; both now fail a test.
4. **`commands check` said "no problems" on a missing folder.** Now exits 1.
5. **Line numbers for scalar entries.** First fixed for targets, defaults and aliases (`key_lines` in the loader); then, in R2, for plain-text commands. The "entry's line, not the key's" decision of 2026-11-08 stands.
6. **The spec went stale in the same PR** (the old `close_app` rule). Found by R2; fixed before merge.

## Left open or handed on

- **Declined to judge (R2):** YAML merge keys (`<<:`) fail as "not valid YAML" (M2's loop; command files don't use them); numeric or empty keys in `aliases` are accepted (harmless, `propertyNames` could refuse them); C1 said removing the rule fails 2 tests and R2 saw 1 (depends on how the rule is removed, both caught).
- **To other issues:** slot names vs `params` and space-only patterns (S2-02); dangerous key combinations, also for `undo.keys` and routine steps (S2-05); the schema's actions against the real registry (S2-04); thresholds read the defaults from the library (S2-07); calling `reload_if_changed()` every 2 s and passing `aliases` to the index (S2-16); showing `problems` in a pop-up and multi-line YAML errors (S2-15).
- **Owner to do:** the "dsa" routine placeholders in `commands/routines.yaml`.

## Not verified

- `docs/issues/s2-01-command-files.md` still says `Status | in progress` (line 9) although the issue is closed; I did not check whether step 9's chart script is what updates it.
- CI per commit: only the two runs at 12:10 were readable; earlier runs are not in this record.
- Whether step 10 (refreshing S2-02, S2-05, S2-07, S2-16 after this merge) has been done: the git log shows none yet.
