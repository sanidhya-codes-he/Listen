# Listen command cheat sheet

Run everything from the repo folder (`...\Listen`). Commands work in PowerShell and Git Bash.
`agent/.venv/Scripts/...` is a full path, so it works **without** activating the venv.

## Set up (once, or when `agent/pyproject.toml` changes)

| Command | What it does |
|---|---|
| `python -m venv agent/.venv` | create the agent's virtual environment |
| `agent/.venv/Scripts/python -m pip install -e "agent[dev]"` | install Listen (editable) + pytest + ruff; creates `listen.exe` |
| `agent\.venv\Scripts\Activate.ps1` | *optional*: put the venv's `Scripts` folder on PATH for this window (`deactivate` undoes it) |

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

CI runs the same `ruff check agent` and `pytest agent` on every push.

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
| `agent/.venv/Scripts/actionlint .github/workflows/ci.yml` | check the CI file (`pip install actionlint-py` first) |
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
