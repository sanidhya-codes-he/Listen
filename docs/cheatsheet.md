# Listen command cheat sheet

Run everything from the repo folder (`...\Listen`) unless a section says `agent/`. Commands work in
PowerShell and Git Bash. `agent/.venv/Scripts/...` is a full path, so it works **without**
activating the venv; inside `agent/`, `uv run <command>` does the same thing more briefly.

## Set up and dependencies (uv, run in `agent/`)

| Command | What it does |
|---|---|
| `winget install --id astral-sh.uv` | install uv itself (once per laptop) |
| `uv sync --extra dev` | create/update `agent/.venv` from `uv.lock`: Python 3.11 + exact versions + Listen (editable) + `listen.exe` |
| `uv sync --locked --extra dev` | the same, but fail if `uv.lock` is out of date with `pyproject.toml` (what CI runs) |
| `uv run pytest` / `uv run ruff check .` / `uv run listen run` | run a command inside `agent/.venv` |
| `uv add faster-whisper` | add a dependency: edits `pyproject.toml`, updates `uv.lock`, installs it |
| `uv add --optional dev <tool>` | add a development-only tool to the `[dev]` group |
| `uv lock --upgrade-package <name>` | move one library to its newest allowed version (then commit `uv.lock`) |
| `uvx <tool>` | run a tool once without adding it to the project, e.g. `uvx --from actionlint-py actionlint` |
| `agent\.venv\Scripts\Activate.ps1` | *optional*: put the venv's `Scripts` folder on PATH for this window (`deactivate` undoes it) |

`uv.lock` is committed (it is the exact recipe); `.venv` is not (it is rebuilt from the lock).

## Run the agent

The three columns do the same thing.

| Full path (always works) | Via Python | If activated |
|---|---|---|
| `agent/.venv/Scripts/listen run` | `agent/.venv/Scripts/python -m listen_agent run` | `listen run` |
| `agent/.venv/Scripts/listen --version` | `... -m listen_agent --version` | `listen --version` |
| `agent/.venv/Scripts/listen --help` | `... -m listen_agent --help` | `listen --help` |

Exit codes: `0` stopped normally, `1` Python crashed, `2` bad command line **or** bad
`settings.yaml` (to be split before stage 2), `3` crash loop or hang (the launcher restarts).

## Tests (pytest)

These options are pytest's own: they work for every test file, and for `pytest server` later.

| Command | What it does |
|---|---|
| `agent/.venv/Scripts/python -m pytest agent` | all tests, short summary |
| `... -m pytest agent -v` | one line per test (verbose) |
| `... -m pytest agent/tests/core/test_settings.py` | one file |
| `... -m pytest agent/tests/core/test_settings.py::test_missing_file_gives_defaults` | one test |
| `... -m pytest agent -k supervisor` | only tests whose name contains "supervisor" |
| `... -m pytest agent -x` | stop at the first failure |
| `... -m pytest agent --lf` | re-run only the tests that failed last time |

Options combine: `... -m pytest agent --lf -x -v`.

## Lint (ruff)

| Command | What it does |
|---|---|
| `agent/.venv/Scripts/ruff check agent` | report likely mistakes (rules set in `agent/pyproject.toml`) |
| `agent/.venv/Scripts/ruff check agent --fix` | report and fix the safe ones (e.g. import order) |

CI runs the same checks (`uv run ruff check .` and `uv run pytest` in `agent/`) on every push.

ruff and pytest are pinned to exact versions in `agent/pyproject.toml`. To upgrade a pinned tool:
change its version there, run `uv lock` and `uv sync --extra dev`, run ruff and pytest, fix
anything new, and merge that as its own PR.

## Git

| Command | What it does |
|---|---|
| `git status` | what changed and is not committed yet |
| `git log --oneline -10` | last 10 commits, one line each |
| `git checkout -b <branch>` | create a branch and switch to it |
| `git checkout main` | switch to `main` |
| `git add <files>` | choose what goes into the next commit |
| `git commit -m "message"` | save a snapshot |
| `git push -u origin <branch>` | upload a new branch (later just `git push`) |
| `git diff --stat main..HEAD` | files this branch changed compared with `main` |
| `git pull` | download and merge new commits from GitHub |

## Other tools

| Command | What it does |
|---|---|
| `uvx --from actionlint-py actionlint .github/workflows/ci.yml` | check the CI file (uv fetches actionlint just for this run) |
| `latexmk -pdf <doc>.tex` then `latexmk -c <doc>.tex` | build a learning-doc PDF, then remove build leftovers (run in `docs/learning`) |
| `curl.exe -s <url>` | fetch a URL; in PowerShell type `curl.exe`, plain `curl` is a different command |

## Coming in later stages (from the spec, not built yet)

| Command | Stage | What it will do |
|---|---|---|
| `listen commands check` | 2 | validate all command YAML files |
| `listen commands try "open vs code"` | 2 | dry run: which command would match |
| `listen record-tests` | 2 | record your voice clips for the speech tests |
| `listen debug on` | 2 | show spoken words in the log until restart |
| `listen review --last 20` | 3 | mark recent commands right / wrong / delete |
| `uvicorn app.main:app --reload` | 4 | start the server |
| `python -m app.cli create-user` | 4 | create your web login |
| `npm ci` / `npm run check` | 5 | install / check the web app |

GitHub CLI commands (issues, PRs, CI, labels, `gh api`, PowerShell traps): [gh-cheatsheet.md](gh-cheatsheet.md).
