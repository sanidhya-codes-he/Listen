# commands/  - YOUR command and routine files (Doc 03, Doc 06)

YAML files the agent loads, in name order: browser.yaml, core.yaml, media.yaml, routines.yaml,
terminal.yaml. Each may have `targets`, `defaults`, `aliases` and `commands`; the rules are in
`../shared/recipe.schema.json`.

- **Check after editing**: `cd agent` then `uv run listen commands check` lists every problem as
  `file:line: ...` and exits 1 if there is one.
- A broken entry is skipped (the others still work); a file that can't be read at all keeps its
  last good version; a deleted file's commands are gone. A running agent rereads changed files
  within 2 seconds.

The laptop copy is the master. Web-app edits are written in here. Note: this repository is public.
