# Stage 1: Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A runnable, tested skeleton of the laptop agent: `listen run` starts an event bus, a
supervised terminal-shell worker and logging, reads `agent/settings.yaml`, and stops cleanly on
Ctrl+C. GitHub Actions runs the agent's lint and tests on every push.

**Architecture:** One Python package `listen_agent` (agent/). `core/` holds the plumbing every
later module uses: events (frozen dataclasses), the event bus (publish/subscribe into inbox
queues), the `Worker` loop (one thread + one inbox per module, heartbeat, errors become
`ModuleError`), the `Supervisor` (restarts dead threads, max 3 a minute; exits on hung threads),
settings and logging. `shell/` holds the v1 terminal shell. `app.py` wires them together.

**Tech Stack:** Python 3.11, PyYAML, pytest, ruff, setuptools (editable install), GitHub Actions.

**Spec:** `docs/specs/2026-10-19-listen-design.md` (§2, §4.1, §4.3, §4.7, §4.8, §9.2, §9.5, §10
stage 1, §11). Learning background: Doc 02 (project structure), Doc 04 (agent internals), Doc 09
(logs, tests, CI).

This is plan 1 of 6. Stages 2 to 6 each get their own plan, written when the previous stage is done.

## Global Constraints

- Python **3.11** (`requires-python = ">=3.11"`); the agent is developed on Windows 11 and tested
  in CI on `windows-latest`.
- Every module talks to the others **only through the event bus**; `core/` imports nothing else
  from `listen_agent`.
- Log format exactly `%(asctime)s %(levelname)-5s %(name)-8s %(message)s`, level `INFO`, file
  `agent/logs/listen.log`, rotating at **1 MB, 5 files kept**. **No spoken words in logs** unless
  debug is on (until the next restart). Never put heard words into exception messages either:
  tracebacks go to the log.
- Event timestamps are **UTC**.
- Non-secret settings in `agent/settings.yaml` (committed). Secrets only in `agent/.env`
  (git-ignored); stage 1 needs none.
- Never commit `.env`, logs, `*.db` or voice clips. Never add Claude co-author or attribution
  lines to commits. **Push only after the owner says yes.** Never push `backup-before-rewrite`.
  Never touch the `Listen_repo` GitHub repository.
- TDD for every task: write the failing test, watch it fail, write the minimum code, watch it pass,
  tidy, commit.
- Code style: PEP 8 checked by `ruff check agent` (line length 100); short lowercase comments above
  the import block and above each logical block.
- Learning project: explain each step to the owner as it is done; Task 9 writes the learning doc.
- Commands below run from the repo root (`C:\Users\sanid\WebstormProjects\LocalProject\Listen`)
  and work in both PowerShell and Git Bash. `agent/.venv/Scripts/python` is the agent's own Python.

## Review Focus

1. **A typo or wrong type in `settings.yaml`** (`threshold:` instead of `thresholds:`,
   `match: yes`) must stop start-up with a message naming the key, never silently fall back to a
   default. Tests: Task 3, `test_bad_values_stop_with_a_message_naming_the_key`.
2. **`settings.yaml` saved with a UTF-8 BOM** (Notepad does this) must load normally. Test: Task 3,
   `test_file_saved_with_bom_loads`.
3. **A worker whose handler fails on every message** must keep running and report each failure;
   handled errors are not thread deaths. Test: Task 6,
   `test_errors_on_every_message_never_stop_the_worker`.
4. **A fresh clone with no `agent/logs/` folder** must create it on first start. Test: Task 4,
   `test_creates_missing_log_folder_and_file`.
5. **Subscribing while another thread is publishing** must not crash or lose the new subscriber.
   Test: Task 5, `test_subscribing_while_others_publish_is_safe`.

---

## File Structure

| File | Responsibility |
|---|---|
| `agent/pyproject.toml` | package metadata, dependencies, `listen` command, pytest and ruff settings |
| `agent/settings.yaml` | the owner's non-secret settings (§11 defaults) |
| `agent/README.md` | how to set up, test, lint and run (modify) |
| `agent/listen_agent/__init__.py` | `__version__` |
| `agent/listen_agent/__main__.py` | command line: `--version`, `run` |
| `agent/listen_agent/app.py` | start-up and shut-down; wires bus, workers, supervisor |
| `agent/listen_agent/core/__init__.py` | marks `core` as a package |
| `agent/listen_agent/core/paths.py` | where files live (agent folder, settings file, log folder) |
| `agent/listen_agent/core/settings.py` | load and validate `settings.yaml` into frozen dataclasses |
| `agent/listen_agent/core/logs.py` | rotating log file, `words()` privacy helper |
| `agent/listen_agent/core/events.py` | `Event` base, `ModuleError` |
| `agent/listen_agent/core/bus.py` | `EventBus` (publish/subscribe into inbox queues) |
| `agent/listen_agent/core/worker.py` | `Worker`: loop, heartbeat, error handling |
| `agent/listen_agent/core/supervisor.py` | `Supervisor`: restart dead threads, detect hung ones |
| `agent/listen_agent/shell/__init__.py` | marks `shell` as a package |
| `agent/listen_agent/shell/terminal.py` | `TerminalShell`: prints one line per event |
| `agent/tests/conftest.py` | `FakeClock` and the `clock` fixture |
| `agent/tests/test_cli.py`, `agent/tests/test_app.py` | CLI and app tests |
| `agent/tests/core/test_*.py`, `agent/tests/shell/test_terminal.py` | one test file per module |
| `.github/workflows/ci.yml` | CI: the `agent` job (server and web jobs arrive in stages 4 and 5) |
| `docs/learning/10-stage-1-foundations.tex/.pdf` | learning doc for the concepts in this stage |

Why only the `agent` CI job now: `server/` and `web/` have no code yet, so their jobs would fail
(pytest exits with an error when it finds no tests; `npm ci` needs a `package.json`). Each job is
added in the stage that creates its program.

---

### Task 1: Agent package scaffolding and the `listen --version` command

**Files:**
- Create: `agent/pyproject.toml`
- Create: `agent/listen_agent/__init__.py`
- Create: `agent/listen_agent/__main__.py`
- Modify: `agent/README.md`
- Test: `agent/tests/test_cli.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `listen_agent.__version__: str`; `listen_agent.__main__.main(argv: list[str] | None = None) -> int`;
  `build_parser() -> argparse.ArgumentParser`. The installed `listen` command calls `main()`.

- [ ] **Step 1: Create the package metadata and version**

`agent/pyproject.toml`:
```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "listen-agent"
dynamic = ["version"]
description = "Listen: the laptop voice agent"
requires-python = ">=3.11"
dependencies = ["pyyaml>=6.0"]

[project.optional-dependencies]
dev = ["pytest>=8.0", "ruff>=0.6"]

[project.scripts]
listen = "listen_agent.__main__:main"

[tool.setuptools.dynamic]
version = { attr = "listen_agent.__version__" }

[tool.setuptools.packages.find]
include = ["listen_agent*"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--import-mode=importlib"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]
```

`agent/listen_agent/__init__.py`:
```python
# the listen agent package; the version lives here only (pyproject.toml reads it)
__version__ = "0.1.0"
```

- [ ] **Step 2: Create the virtual environment and install the package (editable)**

Run:
```
python -m venv agent/.venv
agent/.venv/Scripts/python -m pip install --upgrade pip
agent/.venv/Scripts/python -m pip install -e "agent[dev]"
```
Expected: ends with `Successfully installed ... listen-agent-0.1.0 ... pytest-... ruff-...`.
`agent/.venv/` is already git-ignored (`.venv/`).

- [ ] **Step 3: Write the failing test**

`agent/tests/test_cli.py`:
```python
# tests for the command line
import subprocess
import sys

import pytest

import listen_agent
from listen_agent.__main__ import main


def test_version_flag_prints_version(capsys):
    with pytest.raises(SystemExit) as exit_info:
        main(["--version"])
    assert exit_info.value.code == 0
    assert capsys.readouterr().out.strip() == f"listen {listen_agent.__version__}"


def test_no_arguments_prints_help(capsys):
    assert main([]) == 0
    assert "usage: listen" in capsys.readouterr().out


def test_package_runs_with_python_dash_m():
    result = subprocess.run(
        [sys.executable, "-m", "listen_agent", "--version"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert result.stdout.startswith("listen ")
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/test_cli.py -v`
Expected: FAIL / collection error with `ModuleNotFoundError: No module named 'listen_agent.__main__'`.

- [ ] **Step 5: Write the minimal implementation**

`agent/listen_agent/__main__.py`:
```python
# command line: "python -m listen_agent ..." or the installed "listen ..." command
import argparse
import sys

from listen_agent import __version__


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="listen", description="Listen voice agent")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    parser.parse_args(argv)
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent -v`
Expected: 3 passed.
Also run: `agent/.venv/Scripts/listen --version` → prints `listen 0.1.0`.

- [ ] **Step 7: Document set-up in the agent README**

Append to `agent/README.md`:
````markdown

## Set up (once)

```
python -m venv agent/.venv
agent/.venv/Scripts/python -m pip install -e "agent[dev]"
```

`-e` (editable) means the installed package points at this folder, so code changes apply without
reinstalling. In PyCharm, choose `agent/.venv/Scripts/python.exe` as the project interpreter.

## Every day

```
agent/.venv/Scripts/python -m pytest agent    # run the tests
agent/.venv/Scripts/ruff check agent          # lint: likely mistakes and import order
```
````

- [ ] **Step 8: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!` (fix anything it reports,
`ruff check agent --fix` sorts imports).
```
git add agent/pyproject.toml agent/listen_agent/__init__.py agent/listen_agent/__main__.py agent/tests/test_cli.py agent/README.md
git commit -m "Agent scaffolding: pyproject, package version, listen --version command"
```

---

### Task 2: GitHub Actions CI for the agent

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `agent/pyproject.toml` with the `[dev]` extra (Task 1); `ruff check agent` and
  `pytest agent` passing locally.
- Produces: a `CI` check on every push and pull request. Stage 4 adds the `server` job, stage 5
  the `web` job, to this same file.

- [ ] **Step 1: Write the workflow**

`.github/workflows/ci.yml`:
```yaml
# continuous integration: lint and test on a fresh machine for every push and pull request
name: CI
on: [push, pull_request]

jobs:
  agent:
    runs-on: windows-latest          # the agent uses Windows-only libraries
    steps:
      - uses: actions/checkout@v4    # copy the repo onto the runner
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: pip                 # reuse downloaded libraries between runs
          cache-dependency-path: agent/pyproject.toml
      - run: pip install -e "agent[dev]"
      - run: ruff check agent
      - run: pytest agent            # speech tests (stage 2) skip: no clips on GitHub
```

- [ ] **Step 2: Check the file locally with actionlint**

Run:
```
agent/.venv/Scripts/python -m pip install actionlint-py
agent/.venv/Scripts/actionlint .github/workflows/ci.yml
```
Expected: no output (no problems). `actionlint-py` is a one-off local tool, not a project
dependency.

- [ ] **Step 3: Commit**

```
git add .github/workflows/ci.yml
git commit -m "CI: lint and test the agent on Windows for every push"
```

- [ ] **Step 4: Ask the owner, then push and watch the run**

Ask the owner: "Push main to GitHub so CI runs for the first time?" Only after yes:
```
git push origin main
```
Then open https://github.com/sanidhya-codes-he/Listen/actions and confirm the `CI / agent` run is
green (about 2 minutes). If it is red, read the failing step's log before changing anything.

---

### Task 3: Paths and settings

**Files:**
- Create: `agent/listen_agent/core/__init__.py`
- Create: `agent/listen_agent/core/paths.py`
- Create: `agent/listen_agent/core/settings.py`
- Create: `agent/settings.yaml`
- Test: `agent/tests/core/test_settings.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `paths.AGENT_DIR: Path`, `paths.SETTINGS_FILE: Path` (`agent/settings.yaml`),
    `paths.LOG_DIR: Path` (`agent/logs`).
  - `settings.Settings` (frozen): `mode: str` (`"wake"` or `"continuous"`), `hotkeys: Hotkeys`,
    `thresholds: Thresholds`.
  - `settings.Hotkeys` (frozen): `push_to_talk: str = "ctrl+alt+space"`,
    `continuous_toggle: str = "ctrl+alt+c"`.
  - `settings.Thresholds` (frozen): `hearing: float = 0.60`, `match: float = 0.75`,
    `high_risk_hearing: float = 0.75`, `high_risk_match: float = 0.90`,
    `continuous_extra: float = 0.10`.
  - `settings.load_settings(path: Path) -> Settings`; raises `settings.SettingsError` whose
    message starts with the offending key.

- [ ] **Step 1: Write the failing test**

`agent/tests/core/test_settings.py`:
```python
# tests for loading agent/settings.yaml
from dataclasses import FrozenInstanceError

import pytest

from listen_agent.core.paths import AGENT_DIR, LOG_DIR, SETTINGS_FILE
from listen_agent.core.settings import Settings, SettingsError, load_settings


def write(tmp_path, text, encoding="utf-8"):
    path = tmp_path / "settings.yaml"
    path.write_text(text, encoding=encoding)
    return path


def test_paths_point_into_the_agent_folder():
    assert (AGENT_DIR / "pyproject.toml").exists()
    assert SETTINGS_FILE == AGENT_DIR / "settings.yaml"
    assert LOG_DIR == AGENT_DIR / "logs"


def test_defaults_are_the_spec_values():
    settings = Settings()
    assert settings.mode == "wake"
    assert settings.hotkeys.push_to_talk == "ctrl+alt+space"
    assert settings.hotkeys.continuous_toggle == "ctrl+alt+c"
    t = settings.thresholds
    assert (t.hearing, t.match, t.high_risk_hearing, t.high_risk_match, t.continuous_extra) == (
        0.60,
        0.75,
        0.75,
        0.90,
        0.10,
    )


def test_missing_file_gives_defaults(tmp_path):
    assert load_settings(tmp_path / "missing.yaml") == Settings()


def test_empty_file_gives_defaults(tmp_path):
    assert load_settings(write(tmp_path, "")) == Settings()


def test_shipped_settings_file_matches_the_defaults():
    assert load_settings(SETTINGS_FILE) == Settings()


def test_partial_file_overrides_only_what_it_names(tmp_path):
    settings = load_settings(write(tmp_path, "thresholds:\n  match: 0.8\n"))
    assert settings.thresholds.match == 0.8
    assert settings.thresholds.hearing == 0.60
    assert settings.mode == "wake"


def test_file_saved_with_bom_loads(tmp_path):
    settings = load_settings(write(tmp_path, "mode: continuous\n", encoding="utf-8-sig"))
    assert settings.mode == "continuous"


@pytest.mark.parametrize(
    ("text", "named"),
    [
        ("mode: shouting\n", "mode"),
        ("thresholds:\n  match: 1.5\n", "thresholds.match"),
        ("thresholds:\n  match: yes\n", "thresholds.match"),
        ("thresholds:\n  match: high\n", "thresholds.match"),
        ("hotkeys:\n  push_to_talk: ''\n", "hotkeys.push_to_talk"),
        ("hotkeys: ctrl+alt+space\n", "hotkeys"),
        ("threshold:\n  match: 0.8\n", "threshold"),
        ("thresholds:\n  mtach: 0.8\n", "thresholds.mtach"),
    ],
)
def test_bad_values_stop_with_a_message_naming_the_key(tmp_path, text, named):
    with pytest.raises(SettingsError) as error:
        load_settings(write(tmp_path, text))
    assert str(error.value).startswith(named)


def test_broken_yaml_is_a_settings_error(tmp_path):
    with pytest.raises(SettingsError, match="not valid YAML"):
        load_settings(write(tmp_path, "mode: [wake\n"))


def test_top_level_list_is_rejected(tmp_path):
    with pytest.raises(SettingsError, match="expected keys"):
        load_settings(write(tmp_path, "- wake\n"))


def test_settings_cannot_be_changed_after_loading():
    with pytest.raises(FrozenInstanceError):
        Settings().mode = "continuous"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_settings.py -v`
Expected: collection error `ModuleNotFoundError: No module named 'listen_agent.core'`.

- [ ] **Step 3: Write the implementation**

`agent/listen_agent/core/__init__.py`:
```python
# core: the plumbing every module uses (bus, events, workers, supervisor, settings, logs)
```

`agent/listen_agent/core/paths.py`:
```python
# where files live; other modules ask here instead of building paths themselves
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[2]
SETTINGS_FILE = AGENT_DIR / "settings.yaml"
LOG_DIR = AGENT_DIR / "logs"
```

`agent/listen_agent/core/settings.py`:
```python
# settings: read agent/settings.yaml into frozen objects; a bad value stops start-up
from collections.abc import Callable
from dataclasses import dataclass, field, fields
from pathlib import Path
from typing import Any

import yaml

MODES = ("wake", "continuous")
TOP_LEVEL = ("mode", "hotkeys", "thresholds")


class SettingsError(Exception):
    """settings.yaml is unreadable or has a bad value; the message starts with the key."""


@dataclass(frozen=True)
class Hotkeys:
    push_to_talk: str = "ctrl+alt+space"
    continuous_toggle: str = "ctrl+alt+c"


@dataclass(frozen=True)
class Thresholds:
    # placeholders until calibrated from marked right/wrong data (spec §3.6)
    hearing: float = 0.60
    match: float = 0.75
    high_risk_hearing: float = 0.75
    high_risk_match: float = 0.90
    continuous_extra: float = 0.10


@dataclass(frozen=True)
class Settings:
    mode: str = "wake"
    hotkeys: Hotkeys = field(default_factory=Hotkeys)
    thresholds: Thresholds = field(default_factory=Thresholds)


def load_settings(path: Path) -> Settings:
    """Read settings.yaml. A missing or empty file means all defaults."""
    if not path.exists():
        return Settings()
    try:
        # utf-8-sig also accepts files saved with a byte-order mark (Notepad does this)
        raw = yaml.safe_load(path.read_text(encoding="utf-8-sig"))
    except yaml.YAMLError as exc:
        raise SettingsError(f"{path.name}: not valid YAML ({exc})") from exc
    raw = raw or {}
    if not isinstance(raw, dict):
        raise SettingsError(f"{path.name}: expected keys at the top level")
    for key in raw:
        if key not in TOP_LEVEL:
            raise SettingsError(f"{key}: unknown setting")
    mode = raw.get("mode", "wake")
    if mode not in MODES:
        raise SettingsError(f"mode: must be one of {', '.join(MODES)}, got {mode!r}")
    return Settings(
        mode=mode,
        hotkeys=_section(raw, "hotkeys", Hotkeys, _hotkey),
        thresholds=_section(raw, "thresholds", Thresholds, _threshold),
    )


def _section(raw: dict, name: str, cls: type, check: Callable[[str, Any], Any]) -> Any:
    # one nested block (hotkeys, thresholds): every key must exist and pass its check
    values = raw.get(name)
    if values is None:
        return cls()
    if not isinstance(values, dict):
        raise SettingsError(f"{name}: expected keys under it")
    known = {f.name for f in fields(cls)}
    checked = {}
    for key, value in values.items():
        if key not in known:
            raise SettingsError(f"{name}.{key}: unknown setting")
        checked[key] = check(f"{name}.{key}", value)
    return cls(**checked)


def _hotkey(key: str, value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise SettingsError(f"{key}: must be a key combination like ctrl+alt+space")
    return value.strip()


def _threshold(key: str, value: Any) -> float:
    # bool is a kind of int in Python, so "yes" (read as True) must be refused explicitly
    if isinstance(value, bool) or not isinstance(value, int | float) or not 0 <= value <= 1:
        raise SettingsError(f"{key}: must be a number from 0 to 1, got {value!r}")
    return float(value)
```

`agent/settings.yaml`:
```yaml
# listen agent settings (non-secret). secrets go in agent/.env, never here.
# changes take effect on the next start.

mode: wake                       # wake | continuous (push-to-talk works in both)

hotkeys:
  push_to_talk: ctrl+alt+space   # hold to talk
  continuous_toggle: ctrl+alt+c

thresholds:                      # placeholders until calibrated (spec §3.6)
  hearing: 0.60
  match: 0.75
  high_risk_hearing: 0.75
  high_risk_match: 0.90
  continuous_extra: 0.10         # added to each threshold in continuous mode
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_settings.py -v`
Expected: 18 passed (11 tests, one of them run 8 times by `parametrize`).

- [ ] **Step 5: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!`
```
git add agent/listen_agent/core agent/settings.yaml agent/tests/core/test_settings.py
git commit -m "Agent settings: settings.yaml with spec defaults, strict validation"
```

---

### Task 4: Logging with hidden spoken words

**Files:**
- Create: `agent/listen_agent/core/logs.py`
- Test: `agent/tests/core/test_logs.py`

**Interfaces:**
- Consumes: nothing (the caller passes the folder, normally `paths.LOG_DIR`).
- Produces:
  - `logs.setup_logging(log_dir: Path) -> logging.handlers.RotatingFileHandler`: creates the
    folder, attaches the handler to the root logger at `INFO`, returns the handler so the caller
    can remove and close it.
  - `logs.words(text: str) -> str`: use for anything the owner said:
    `log.info("heard %s", words(text))`.
  - `logs.set_debug_words(on: bool) -> None`; `logs.HIDDEN == "[words hidden]"`.
  - Convention: loggers are named after the module area, `logging.getLogger("core")`,
    `"shell"`, later `"voice"`, `"intent"`, and so on (8 characters or fewer, to fit the format).

- [ ] **Step 1: Write the failing test**

`agent/tests/core/test_logs.py`:
```python
# tests for the log file and the spoken-words privacy rule
import logging
import re

import pytest

from listen_agent.core import logs
from listen_agent.core.logs import HIDDEN, setup_logging, words


@pytest.fixture
def log_file(tmp_path):
    handler = setup_logging(tmp_path / "logs")
    yield tmp_path / "logs" / "listen.log"
    logging.getLogger().removeHandler(handler)
    handler.close()


@pytest.fixture(autouse=True)
def words_hidden_again():
    yield
    logs.set_debug_words(False)


def test_creates_missing_log_folder_and_file(log_file):
    logging.getLogger("core").info("hello")
    assert log_file.exists()


def test_line_format_is_time_level_module_message(log_file):
    logging.getLogger("core").info("ready")
    line = log_file.read_text(encoding="utf-8").splitlines()[-1]
    assert re.fullmatch(r"\d{4}-\d\d-\d\d \d\d:\d\d:\d\d,\d{3} INFO  core     ready", line)


def test_debug_lines_are_not_written(log_file):
    logging.getLogger("core").debug("noise")
    assert "noise" not in log_file.read_text(encoding="utf-8")


def test_rotates_at_1_mb_keeping_5_old_files(tmp_path):
    handler = setup_logging(tmp_path)
    try:
        assert handler.maxBytes == 1_048_576
        assert handler.backupCount == 5
    finally:
        logging.getLogger().removeHandler(handler)
        handler.close()


def test_words_start_hidden():
    assert words("open vs code") == HIDDEN


def test_spoken_words_never_reach_the_log_by_default(log_file):
    logging.getLogger("intent").info("heard %s", words("search what is an atom"))
    text = log_file.read_text(encoding="utf-8")
    assert "atom" not in text
    assert HIDDEN in text


def test_debug_on_shows_words(log_file):
    logs.set_debug_words(True)
    logging.getLogger("intent").info("heard %s", words("open vs code"))
    assert "'open vs code'" in log_file.read_text(encoding="utf-8")
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_logs.py -v`
Expected: collection error `ModuleNotFoundError: No module named 'listen_agent.core.logs'`.

- [ ] **Step 3: Write the implementation**

`agent/listen_agent/core/logs.py`:
```python
# logging: one rotating file of ids, timings and errors; spoken words only after "debug on"
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_FORMAT = "%(asctime)s %(levelname)-5s %(name)-8s %(message)s"
MAX_BYTES = 1_048_576  # 1 MB per file
BACKUP_COUNT = 5  # listen.log.1 ... listen.log.5, about 5 MB at most
HIDDEN = "[words hidden]"

# module-level flag: starts off at every process start, so "debug on" lasts until restart
_debug_words = False


def setup_logging(log_dir: Path) -> RotatingFileHandler:
    log_dir.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(
        log_dir / "listen.log",
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(handler)
    return handler


def set_debug_words(on: bool) -> None:
    global _debug_words
    _debug_words = on


def words(text: str) -> str:
    """Wrap anything the owner said before logging it: hidden unless debug is on."""
    return repr(text) if _debug_words else HIDDEN
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_logs.py -v`
Expected: 7 passed.

- [ ] **Step 5: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!`
```
git add agent/listen_agent/core/logs.py agent/tests/core/test_logs.py
git commit -m "Agent logging: rotating 1 MB x 5 file, spoken words hidden by default"
```

---

### Task 5: Events and the event bus

**Files:**
- Create: `agent/listen_agent/core/events.py`
- Create: `agent/listen_agent/core/bus.py`
- Test: `agent/tests/core/test_events.py`
- Test: `agent/tests/core/test_bus.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `events.Event`: frozen dataclass base with keyword-only `created_at: datetime` (UTC,
    filled automatically). Subclasses are declared `@dataclass(frozen=True)` and may have
    positional fields.
  - `events.ModuleError(module: str, error: str)`.
  - `bus.EventBus()`: `subscribe(event_type: type[Event], inbox: queue.Queue) -> None`,
    `publish(event: Event) -> None`. Subscribing to a class also receives its subclasses
    (subscribing to `Event` receives everything). An inbox gets each event at most once.
  - Later stages add the other §4.3 events to `events.py` when they first publish them.

- [ ] **Step 1: Write the failing tests**

`agent/tests/core/test_events.py`:
```python
# tests for event objects
from dataclasses import FrozenInstanceError
from datetime import UTC, datetime, timedelta

import pytest

from listen_agent.core.events import ModuleError


def test_module_error_takes_module_and_error():
    event = ModuleError("voice", "OSError: no microphone")
    assert event.module == "voice"
    assert event.error == "OSError: no microphone"


def test_events_record_when_they_were_made_in_utc():
    event = ModuleError("voice", "x")
    assert event.created_at.tzinfo is UTC
    assert datetime.now(UTC) - event.created_at < timedelta(seconds=1)


def test_events_cannot_be_changed():
    event = ModuleError("voice", "x")
    with pytest.raises(FrozenInstanceError):
        event.module = "intent"
```

`agent/tests/core/test_bus.py`:
```python
# tests for the publish/subscribe event bus
import queue
import threading
from dataclasses import dataclass

import pytest

from listen_agent.core.bus import EventBus
from listen_agent.core.events import Event


@dataclass(frozen=True)
class Ping(Event):
    n: int


@dataclass(frozen=True)
class Pong(Event):
    n: int


@pytest.fixture
def bus():
    return EventBus()


def test_subscriber_receives_events_of_its_type(bus):
    inbox = queue.Queue()
    bus.subscribe(Ping, inbox)
    event = Ping(1)
    bus.publish(event)
    assert inbox.get_nowait() is event


def test_subscriber_does_not_receive_other_types(bus):
    inbox = queue.Queue()
    bus.subscribe(Ping, inbox)
    bus.publish(Pong(1))
    assert inbox.empty()


def test_subscribing_to_event_receives_everything(bus):
    inbox = queue.Queue()
    bus.subscribe(Event, inbox)
    bus.publish(Ping(1))
    bus.publish(Pong(2))
    assert [inbox.get_nowait().n, inbox.get_nowait().n] == [1, 2]


def test_base_and_exact_subscription_deliver_once(bus):
    inbox = queue.Queue()
    bus.subscribe(Event, inbox)
    bus.subscribe(Ping, inbox)
    bus.publish(Ping(1))
    assert inbox.qsize() == 1


def test_same_subscription_twice_delivers_once(bus):
    inbox = queue.Queue()
    bus.subscribe(Ping, inbox)
    bus.subscribe(Ping, inbox)
    bus.publish(Ping(1))
    assert inbox.qsize() == 1


def test_every_subscriber_gets_the_same_event(bus):
    first, second = queue.Queue(), queue.Queue()
    bus.subscribe(Ping, first)
    bus.subscribe(Ping, second)
    event = Ping(1)
    bus.publish(event)
    assert first.get_nowait() is event
    assert second.get_nowait() is event


def test_publish_without_subscribers_is_fine(bus):
    bus.publish(Ping(1))


def test_publishing_from_many_threads_loses_nothing(bus):
    inbox = queue.Queue()
    bus.subscribe(Ping, inbox)

    def publish_many():
        for i in range(500):
            bus.publish(Ping(i))

    threads = [threading.Thread(target=publish_many) for _ in range(8)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert inbox.qsize() == 8 * 500


def test_subscribing_while_others_publish_is_safe(bus):
    stop = threading.Event()

    def publish_until_stopped():
        while not stop.is_set():
            bus.publish(Ping(0))

    publisher = threading.Thread(target=publish_until_stopped)
    publisher.start()
    inboxes = [queue.Queue() for _ in range(200)]
    for inbox in inboxes:
        bus.subscribe(Ping, inbox)
    stop.set()
    publisher.join()
    bus.publish(Ping(1))
    assert all(not inbox.empty() for inbox in inboxes)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_events.py agent/tests/core/test_bus.py -v`
Expected: collection errors `No module named 'listen_agent.core.events'` / `'listen_agent.core.bus'`.

- [ ] **Step 3: Write the implementation**

`agent/listen_agent/core/events.py`:
```python
# events: frozen dataclasses that travel on the bus; each records when it was made (UTC)
from dataclasses import dataclass, field
from datetime import UTC, datetime


def _now() -> datetime:
    return datetime.now(UTC)


# kw_only: created_at goes last and by name, so subclasses can have required positional fields
@dataclass(frozen=True, kw_only=True)
class Event:
    created_at: datetime = field(default_factory=_now)


@dataclass(frozen=True)
class ModuleError(Event):
    """A worker caught an error; it keeps running."""

    module: str
    error: str
```

`agent/listen_agent/core/bus.py`:
```python
# event bus: publish/subscribe between modules; delivers each event into subscribers' inboxes
import queue
import threading
from collections import defaultdict

from listen_agent.core.events import Event


class EventBus:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._subscribers: dict[type[Event], list[queue.Queue]] = defaultdict(list)

    def subscribe(self, event_type: type[Event], inbox: queue.Queue) -> None:
        with self._lock:
            if inbox not in self._subscribers[event_type]:
                self._subscribers[event_type].append(inbox)

    def publish(self, event: Event) -> None:
        # collect under the lock, deliver outside it so a slow put never blocks subscribe()
        with self._lock:
            inboxes: list[queue.Queue] = []
            for cls in type(event).__mro__:  # the class, its parents, ..., Event, object
                for inbox in self._subscribers.get(cls, ()):
                    if inbox not in inboxes:
                        inboxes.append(inbox)
        for inbox in inboxes:
            inbox.put(event)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_events.py agent/tests/core/test_bus.py -v`
Expected: 12 passed.

- [ ] **Step 5: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!`
```
git add agent/listen_agent/core/events.py agent/listen_agent/core/bus.py agent/tests/core/test_events.py agent/tests/core/test_bus.py
git commit -m "Agent event bus: frozen UTC-stamped events, thread-safe publish/subscribe"
```

---

### Task 6: The worker loop

**Files:**
- Create: `agent/listen_agent/core/worker.py`
- Create: `agent/tests/conftest.py`
- Test: `agent/tests/core/test_worker.py`

**Interfaces:**
- Consumes: `EventBus.publish`, `ModuleError(module, error)` (Task 5).
- Produces:
  - `worker.Worker(bus: EventBus, clock: Callable[[], float] = time.monotonic)`. Subclasses set
    class attribute `name: str` and override `handle(message: object) -> None`; may override
    `idle() -> None` (runs after `wait_seconds` with no message) and class attribute
    `wait_seconds: float = 1.0`.
  - Attributes: `inbox: queue.Queue` (belongs to the worker, survives thread restarts),
    `last_beat: float` (clock value of the last heartbeat), `clock`, `bus`.
  - Methods: `beat()`, `run_once()` (one loop pass), `run(stop: threading.Event)` (the thread
    target; loops until `stop` is set).
  - Errors (`Exception`) in `handle`/`idle` are logged with traceback and published as
    `ModuleError(name, "<ExceptionType>: <message>")`; the loop continues. A `BaseException`
    escaping is logged as "died" and kills the thread (the supervisor's job).
  - Test fixture `clock` (in `agent/tests/conftest.py`): a `FakeClock` with `.now`,
    `__call__()`, `advance(seconds)`.

- [ ] **Step 1: Write the shared fake clock**

`agent/tests/conftest.py`:
```python
# shared test helpers: a clock the test controls
import pytest


class FakeClock:
    """Stands in for time.monotonic; time moves only when a test calls advance()."""

    def __init__(self, start: float = 1000.0) -> None:
        self.now = start

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()
```

- [ ] **Step 2: Write the failing test**

`agent/tests/core/test_worker.py`:
```python
# tests for the worker loop every module runs
import queue
import threading

import pytest

from listen_agent.core.bus import EventBus
from listen_agent.core.events import ModuleError
from listen_agent.core.worker import Worker


class Recorder(Worker):
    name = "recorder"
    wait_seconds = 0.01

    def __init__(self, bus, **kwargs):
        super().__init__(bus, **kwargs)
        self.handled = []
        self.idle_calls = 0

    def handle(self, message):
        if message == "boom":
            raise ValueError("boom")
        self.handled.append(message)

    def idle(self):
        self.idle_calls += 1


class Fatal(BaseException):
    """Escapes 'except Exception', like a real crash would."""


class Dier(Recorder):
    name = "dier"

    def handle(self, message):
        raise Fatal()


@pytest.fixture
def bus():
    return EventBus()


@pytest.fixture
def errors(bus):
    inbox = queue.Queue()
    bus.subscribe(ModuleError, inbox)
    return inbox


def test_handles_a_message_from_its_inbox(bus):
    worker = Recorder(bus)
    worker.inbox.put("hello")
    worker.run_once()
    assert worker.handled == ["hello"]


def test_idle_runs_when_the_inbox_stays_empty(bus):
    worker = Recorder(bus)
    worker.run_once()
    assert worker.idle_calls == 1
    assert worker.handled == []


def test_none_is_an_ordinary_message(bus):
    worker = Recorder(bus)
    worker.inbox.put(None)
    worker.run_once()
    assert worker.handled == [None]
    assert worker.idle_calls == 0


def test_error_is_logged_published_and_the_worker_continues(bus, errors, caplog):
    worker = Recorder(bus)
    worker.inbox.put("boom")
    worker.inbox.put("after")
    worker.run_once()
    worker.run_once()
    error = errors.get_nowait()
    assert (error.module, error.error) == ("recorder", "ValueError: boom")
    assert worker.handled == ["after"]
    assert "recorder failed" in caplog.text


def test_errors_on_every_message_never_stop_the_worker(bus, errors):
    worker = Recorder(bus)
    for _ in range(3):
        worker.inbox.put("boom")
    stop = threading.Event()
    thread = threading.Thread(target=worker.run, args=(stop,))
    thread.start()
    for _ in range(3):
        assert errors.get(timeout=2).module == "recorder"
    assert thread.is_alive()
    stop.set()
    thread.join(timeout=2)
    assert not thread.is_alive()


def test_each_pass_records_a_heartbeat(bus, clock):
    worker = Recorder(bus, clock=clock)
    clock.advance(10)
    worker.run_once()
    assert worker.last_beat == clock.now


def test_run_stops_when_stop_is_set(bus):
    worker = Recorder(bus)
    stop = threading.Event()
    thread = threading.Thread(target=worker.run, args=(stop,))
    thread.start()
    stop.set()
    thread.join(timeout=1)
    assert not thread.is_alive()


def test_a_crash_escapes_the_loop_and_is_logged(bus, caplog):
    worker = Dier(bus)
    worker.inbox.put("x")
    with pytest.raises(Fatal):
        worker.run(threading.Event())
    assert "dier died" in caplog.text
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_worker.py -v`
Expected: collection error `No module named 'listen_agent.core.worker'`.

- [ ] **Step 4: Write the implementation**

`agent/listen_agent/core/worker.py`:
```python
# worker: the loop each module runs in its own thread; errors are reported, never fatal
import logging
import queue
import threading
import time
from collections.abc import Callable

from listen_agent.core.bus import EventBus
from listen_agent.core.events import ModuleError

log = logging.getLogger("core")

# a unique object that means "nothing arrived"; None can't be used, it is a valid message
_NOTHING = object()


class Worker:
    """Subclasses set `name` and override handle(); idle() runs when nothing arrived."""

    name = "worker"
    wait_seconds = 1.0  # also the heartbeat interval of an idle worker

    def __init__(self, bus: EventBus, clock: Callable[[], float] = time.monotonic) -> None:
        self.bus = bus
        self.clock = clock
        self.inbox: queue.Queue = queue.Queue()
        self.last_beat = clock()

    def handle(self, message: object) -> None:
        raise NotImplementedError

    def idle(self) -> None:
        """Called after wait_seconds with no message; periodic checks go here."""

    def beat(self) -> None:
        self.last_beat = self.clock()

    def run_once(self) -> None:
        self.beat()
        try:
            message = self.inbox.get(timeout=self.wait_seconds)
        except queue.Empty:
            message = _NOTHING
        try:
            if message is _NOTHING:
                self.idle()
            else:
                self.handle(message)
        except Exception as exc:
            log.exception("%s failed handling %s", self.name, type(message).__name__)
            self.bus.publish(ModuleError(self.name, f"{type(exc).__name__}: {exc}"))

    def run(self, stop: threading.Event) -> None:
        while not stop.is_set():
            try:
                self.run_once()
            except BaseException:
                log.critical("%s died; the message it was handling is lost", self.name)
                raise
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_worker.py -v`
Expected: 8 passed.

- [ ] **Step 6: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!`
```
git add agent/listen_agent/core/worker.py agent/tests/conftest.py agent/tests/core/test_worker.py
git commit -m "Agent worker loop: inbox, heartbeat, errors published as ModuleError"
```

---

### Task 7: The supervisor

**Files:**
- Create: `agent/listen_agent/core/supervisor.py`
- Test: `agent/tests/core/test_supervisor.py`

**Interfaces:**
- Consumes: `Worker` (`name`, `inbox`, `last_beat`, `beat()`, `run(stop)`) from Task 6; the
  `clock` fixture.
- Produces:
  - `supervisor.Supervisor(workers: Iterable[Worker], stop: threading.Event,
    on_fatal: Callable[[str], None], clock: Callable[[], float] = time.monotonic)`; raises
    `ValueError` on duplicate worker names.
  - `start()`: one daemon thread per worker, named after it. `threads: dict[str, threading.Thread]`.
  - `check()`: one inspection pass. Dead thread → new thread for the same worker (max
    `MAX_RESTARTS = 3` within `RESTART_WINDOW = 60.0` s; the next death calls
    `on_fatal("<name> keeps crashing")`). Heartbeat older than `HUNG_AFTER = 30.0` s →
    `on_fatal("<name> stopped responding")`.
  - `run()`: calls `check()` every `CHECK_EVERY = 5.0` s until `stop` is set (the thread target).
  - The supervisor and the workers must share one clock.

- [ ] **Step 1: Write the failing test**

`agent/tests/core/test_supervisor.py`:
```python
# tests for the supervisor: dead threads replaced, crash loops and hangs escalate
import threading

import pytest

from listen_agent.core.bus import EventBus
from listen_agent.core.supervisor import Supervisor
from listen_agent.core.worker import Worker


class Sleeper(Worker):
    """Healthy: waits for messages and beats every pass."""

    name = "sleeper"
    wait_seconds = 0.01

    def handle(self, message):
        pass


class Quitter(Worker):
    """Its thread ends at once, so it looks dead to the supervisor."""

    name = "quitter"

    def __init__(self, bus, **kwargs):
        super().__init__(bus, **kwargs)
        self.runs = 0

    def run(self, stop):
        self.runs += 1


class Stuck(Worker):
    """Alive but never beats, so it looks hung."""

    name = "stuck"

    def run(self, stop):
        stop.wait()


@pytest.fixture
def bus():
    return EventBus()


@pytest.fixture
def stop():
    event = threading.Event()
    yield event
    event.set()  # lets every test thread finish


def supervise(worker, stop, clock):
    fatal = []
    supervisor = Supervisor([worker], stop, on_fatal=fatal.append, clock=clock)
    supervisor.start()
    return supervisor, fatal


def let_thread_end(supervisor, name):
    supervisor.threads[name].join(timeout=1)


def test_each_worker_runs_in_its_own_named_thread(bus, stop, clock):
    supervisor, _ = supervise(Sleeper(bus, clock=clock), stop, clock)
    thread = supervisor.threads["sleeper"]
    assert thread.is_alive()
    assert thread.name == "sleeper"


def test_dead_thread_is_replaced_with_same_worker_and_inbox(bus, stop, clock):
    worker = Quitter(bus, clock=clock)
    worker.inbox.put("waiting")
    inbox = worker.inbox
    supervisor, fatal = supervise(worker, stop, clock)
    first = supervisor.threads["quitter"]
    let_thread_end(supervisor, "quitter")
    supervisor.check()
    let_thread_end(supervisor, "quitter")
    assert supervisor.threads["quitter"] is not first
    assert worker.runs == 2
    assert worker.inbox is inbox
    assert inbox.get_nowait() == "waiting"
    assert fatal == []


def test_fourth_death_within_a_minute_is_fatal(bus, stop, clock):
    worker = Quitter(bus, clock=clock)
    supervisor, fatal = supervise(worker, stop, clock)
    for _ in range(3):
        let_thread_end(supervisor, "quitter")
        supervisor.check()
        clock.advance(5)
    let_thread_end(supervisor, "quitter")
    supervisor.check()
    assert worker.runs == 4
    assert fatal == ["quitter keeps crashing"]


def test_deaths_spread_over_minutes_are_not_fatal(bus, stop, clock):
    worker = Quitter(bus, clock=clock)
    supervisor, fatal = supervise(worker, stop, clock)
    for _ in range(5):
        let_thread_end(supervisor, "quitter")
        clock.advance(61)
        supervisor.check()
    let_thread_end(supervisor, "quitter")
    assert worker.runs == 6
    assert fatal == []


def test_silent_for_more_than_30_seconds_is_hung(bus, stop, clock):
    supervisor, fatal = supervise(Stuck(bus, clock=clock), stop, clock)
    clock.advance(31)
    supervisor.check()
    assert fatal == ["stuck stopped responding"]


def test_silent_for_29_seconds_is_fine(bus, stop, clock):
    supervisor, fatal = supervise(Stuck(bus, clock=clock), stop, clock)
    clock.advance(29)
    supervisor.check()
    assert fatal == []


def test_duplicate_worker_names_are_refused(bus, stop, clock):
    with pytest.raises(ValueError, match="sleeper"):
        Supervisor([Sleeper(bus), Sleeper(bus)], stop, on_fatal=print, clock=clock)


def test_run_returns_once_stop_is_set(bus, stop, clock):
    supervisor = Supervisor([Sleeper(bus)], stop, on_fatal=print, clock=clock)
    stop.set()
    supervisor.run()  # returns at once instead of checking every 5 s forever
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_supervisor.py -v`
Expected: collection error `No module named 'listen_agent.core.supervisor'`.

- [ ] **Step 3: Write the implementation**

`agent/listen_agent/core/supervisor.py`:
```python
# supervisor: every 5 s, replace dead worker threads (max 3 a minute) and escalate hangs
import logging
import threading
import time
from collections import deque
from collections.abc import Callable, Iterable

from listen_agent.core.worker import Worker

log = logging.getLogger("core")

CHECK_EVERY = 5.0
MAX_RESTARTS = 3
RESTART_WINDOW = 60.0
HUNG_AFTER = 30.0


class Supervisor:
    def __init__(
        self,
        workers: Iterable[Worker],
        stop: threading.Event,
        on_fatal: Callable[[str], None],
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.workers = list(workers)
        names = [worker.name for worker in self.workers]
        duplicates = sorted({name for name in names if names.count(name) > 1})
        if duplicates:
            raise ValueError(f"worker names must be unique: {', '.join(duplicates)}")
        self.stop = stop
        self.on_fatal = on_fatal
        self.clock = clock
        self.threads: dict[str, threading.Thread] = {}
        self._restarts: dict[str, deque[float]] = {name: deque() for name in names}

    def start(self) -> None:
        for worker in self.workers:
            self._start_thread(worker)

    def check(self) -> None:
        now = self.clock()
        for worker in self.workers:
            if not self.threads[worker.name].is_alive():
                if not self._may_restart(worker.name, now):
                    self.on_fatal(f"{worker.name} keeps crashing")
                    return
                log.warning("%s thread died; starting a new one", worker.name)
                self._start_thread(worker)
            elif now - worker.last_beat > HUNG_AFTER:
                # python cannot kill a thread safely, so the whole agent must restart
                self.on_fatal(f"{worker.name} stopped responding")
                return

    def run(self) -> None:
        while not self.stop.wait(CHECK_EVERY):
            self.check()

    def _start_thread(self, worker: Worker) -> None:
        # a python thread can't be restarted: make a new one for the same worker and inbox
        worker.beat()
        thread = threading.Thread(
            target=worker.run, args=(self.stop,), name=worker.name, daemon=True
        )
        self.threads[worker.name] = thread
        thread.start()

    def _may_restart(self, name: str, now: float) -> bool:
        # keep only restarts from the last minute, then allow at most 3
        recent = self._restarts[name]
        while recent and now - recent[0] >= RESTART_WINDOW:
            recent.popleft()
        if len(recent) >= MAX_RESTARTS:
            return False
        recent.append(now)
        return True
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent/tests/core/test_supervisor.py -v`
Expected: 8 passed.

- [ ] **Step 5: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!`
```
git add agent/listen_agent/core/supervisor.py agent/tests/core/test_supervisor.py
git commit -m "Agent supervisor: replace dead threads (max 3/min), escalate crash loops and hangs"
```

---

### Task 8: Terminal shell, app wiring and `listen run`

**Files:**
- Create: `agent/listen_agent/shell/__init__.py`
- Create: `agent/listen_agent/shell/terminal.py`
- Create: `agent/listen_agent/app.py`
- Modify: `agent/listen_agent/__main__.py` (replace whole file)
- Modify: `agent/README.md`
- Test: `agent/tests/shell/test_terminal.py`
- Test: `agent/tests/test_app.py`
- Modify: `agent/tests/test_cli.py` (add two tests)

**Interfaces:**
- Consumes: everything from Tasks 3 to 7: `load_settings`, `SettingsError`, `Settings`,
  `SETTINGS_FILE`, `LOG_DIR`, `setup_logging`, `EventBus`, `Event`, `ModuleError`, `Worker`,
  `Supervisor`.
- Produces:
  - `terminal.describe(event: Event) -> str`; `terminal.TerminalShell(bus, out=print, **worker_kwargs)`
    (worker name `"shell"`, subscribes to `Event`). Stage 2 adds lines for its events (§4.8).
  - `app.App(settings: Settings, out: Callable[[str], None] = print)` with `bus`, `stop`,
    `workers: list[Worker]`, `supervisor`, `exit_code`, `start()`, `fatal(reason: str)`,
    `shutdown()`. Later stages append their workers to `App.workers`' construction.
  - `app.run_agent(settings_file: Path = SETTINGS_FILE, log_dir: Path = LOG_DIR,
    out: Callable[[str], None] = print) -> int`.
  - Exit codes: `EXIT_OK = 0`, `EXIT_BAD_SETTINGS = 2`, `EXIT_FATAL = 3` (stage 2's launcher
    restarts the agent on `EXIT_FATAL` only).
  - CLI: `listen run` → `run_agent()`.

- [ ] **Step 1: Write the failing tests**

`agent/tests/shell/test_terminal.py`:
```python
# tests for the terminal shell
from dataclasses import dataclass

from listen_agent.core.bus import EventBus
from listen_agent.core.events import Event, ModuleError
from listen_agent.shell.terminal import TerminalShell, describe


@dataclass(frozen=True)
class Ping(Event):
    n: int


def test_module_errors_name_the_module():
    assert describe(ModuleError("voice", "OSError: no mic")) == "error in voice: OSError: no mic"


def test_other_events_show_their_name():
    assert describe(Ping(1)) == "Ping"


def test_shell_prints_every_event_on_the_bus():
    bus = EventBus()
    lines = []
    shell = TerminalShell(bus, out=lines.append)
    bus.publish(Ping(1))
    bus.publish(ModuleError("voice", "x"))
    shell.run_once()
    shell.run_once()
    assert lines == ["Ping", "error in voice: x"]
```

`agent/tests/test_app.py`:
```python
# tests for start-up and shut-down
import time

from listen_agent.app import EXIT_BAD_SETTINGS, EXIT_FATAL, EXIT_OK, App, run_agent
from listen_agent.core.events import ModuleError
from listen_agent.core.settings import Settings


def wait_for(condition, timeout=2.0):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if condition():
            return True
        time.sleep(0.01)
    return False


def test_app_prints_bus_events_and_shuts_down_cleanly():
    lines = []
    app = App(Settings(), out=lines.append)
    app.start()
    app.bus.publish(ModuleError("demo", "ValueError: boom"))
    assert wait_for(lambda: "error in demo: ValueError: boom" in lines)
    app.shutdown()
    assert not any(thread.is_alive() for thread in app.supervisor.threads.values())
    assert app.exit_code == EXIT_OK


def test_fatal_stops_the_app_with_the_restart_code():
    app = App(Settings(), out=lambda line: None)
    app.fatal("shell stopped responding")
    assert app.stop.is_set()
    assert app.exit_code == EXIT_FATAL


def test_run_agent_refuses_bad_settings(tmp_path):
    settings_file = tmp_path / "settings.yaml"
    settings_file.write_text("mode: shouting\n", encoding="utf-8")
    lines = []
    code = run_agent(settings_file=settings_file, log_dir=tmp_path / "logs", out=lines.append)
    assert code == EXIT_BAD_SETTINGS
    assert lines[0].startswith("Can't start: mode:")
    assert "bad settings" in (tmp_path / "logs" / "listen.log").read_text(encoding="utf-8")
```

Add to `agent/tests/test_cli.py`:
```python
def test_run_subcommand_starts_the_agent(monkeypatch):
    monkeypatch.setattr("listen_agent.__main__.run_agent", lambda: 7)
    assert main(["run"]) == 7


def test_help_lists_run(capsys):
    main([])
    assert "run" in capsys.readouterr().out
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `agent/.venv/Scripts/python -m pytest agent -v`
Expected: collection errors for `listen_agent.shell.terminal` and `listen_agent.app`, and
`test_run_subcommand_starts_the_agent` fails (`AttributeError: ... has no attribute 'run_agent'`).

- [ ] **Step 3: Write the terminal shell**

`agent/listen_agent/shell/__init__.py`:
```python
# shell: what the owner sees (terminal in v1, system tray later)
```

`agent/listen_agent/shell/terminal.py`:
```python
# terminal shell (v1): prints one line per bus event (spec §4.8)
from collections.abc import Callable

from listen_agent.core.bus import EventBus
from listen_agent.core.events import Event, ModuleError
from listen_agent.core.worker import Worker


def describe(event: Event) -> str:
    # stage 2 adds a line format for each voice and command event
    if isinstance(event, ModuleError):
        return f"error in {event.module}: {event.error}"
    return type(event).__name__


class TerminalShell(Worker):
    name = "shell"

    def __init__(self, bus: EventBus, out: Callable[[str], None] = print, **kwargs) -> None:
        super().__init__(bus, **kwargs)
        self.out = out
        bus.subscribe(Event, self.inbox)

    def handle(self, message: object) -> None:
        self.out(describe(message))
```

- [ ] **Step 4: Write the app**

`agent/listen_agent/app.py`:
```python
# start-up and shut-down of the agent (spec §4.7); later stages add their workers here
import logging
import threading
from collections.abc import Callable
from pathlib import Path

from listen_agent import __version__
from listen_agent.core.bus import EventBus
from listen_agent.core.logs import setup_logging
from listen_agent.core.paths import LOG_DIR, SETTINGS_FILE
from listen_agent.core.settings import Settings, SettingsError, load_settings
from listen_agent.core.supervisor import Supervisor
from listen_agent.core.worker import Worker
from listen_agent.shell.terminal import TerminalShell

log = logging.getLogger("core")

EXIT_OK = 0
EXIT_BAD_SETTINGS = 2  # the owner must fix settings.yaml; restarting would not help
EXIT_FATAL = 3  # crash loop or hang: the launcher (stage 2) restarts the agent
JOIN_SECONDS = 2.0


class App:
    def __init__(self, settings: Settings, out: Callable[[str], None] = print) -> None:
        self.settings = settings
        self.exit_code = EXIT_OK
        self.stop = threading.Event()
        self.bus = EventBus()
        self.workers: list[Worker] = [TerminalShell(self.bus, out=out)]
        self.supervisor = Supervisor(self.workers, self.stop, on_fatal=self.fatal)
        self._supervisor_thread = threading.Thread(
            target=self.supervisor.run, name="supervisor", daemon=True
        )

    def start(self) -> None:
        self.supervisor.start()
        self._supervisor_thread.start()

    def fatal(self, reason: str) -> None:
        log.critical("stopping: %s", reason)
        self.exit_code = EXIT_FATAL
        self.stop.set()

    def shutdown(self) -> None:
        # a hung thread can't be joined; daemon threads end with the process anyway
        self.stop.set()
        for thread in [*self.supervisor.threads.values(), self._supervisor_thread]:
            if thread.is_alive():
                thread.join(timeout=JOIN_SECONDS)


def run_agent(
    settings_file: Path = SETTINGS_FILE,
    log_dir: Path = LOG_DIR,
    out: Callable[[str], None] = print,
) -> int:
    handler = setup_logging(log_dir)
    try:
        try:
            settings = load_settings(settings_file)
        except SettingsError as exc:
            log.error("bad settings: %s", exc)
            out(f"Can't start: {exc}")
            return EXIT_BAD_SETTINGS
        app = App(settings, out=out)
        app.start()
        log.info("ready (version %s, mode %s)", __version__, settings.mode)
        out("Listen is ready. Press Ctrl+C to stop.")
        try:
            # wait in short steps so Ctrl+C is noticed promptly on Windows
            while not app.stop.wait(0.5):
                pass
        except KeyboardInterrupt:
            out("Stopping...")
        app.shutdown()
        log.info("stopped (exit code %s)", app.exit_code)
        return app.exit_code
    finally:
        logging.getLogger().removeHandler(handler)
        handler.close()
```

- [ ] **Step 5: Add the `run` subcommand**

Replace `agent/listen_agent/__main__.py` with:
```python
# command line: "python -m listen_agent ..." or the installed "listen ..." command
import argparse
import sys

from listen_agent import __version__
from listen_agent.app import run_agent


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="listen", description="Listen voice agent")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    commands = parser.add_subparsers(dest="command", metavar="command")
    commands.add_parser("run", help="start the agent (Ctrl+C stops it)")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "run":
        return run_agent()
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `agent/.venv/Scripts/python -m pytest agent -v`
Expected: all pass (5 CLI, 18 settings, 7 logs, 12 events and bus, 8 worker, 8 supervisor,
3 terminal, 3 app = 64 passed).

- [ ] **Step 7: Try it by hand**

Run: `agent/.venv/Scripts/listen run`
Expected: `Listen is ready. Press Ctrl+C to stop.`; press Ctrl+C → `Stopping...` and the prompt
returns. Then check the log: `agent/logs/listen.log` ends with two lines like
`2026-10-21 18:02:11,532 INFO  core     ready (version 0.1.0, mode wake)` and
`... INFO  core     stopped (exit code 0)`. Run `git status`: `agent/logs/` must not appear.

- [ ] **Step 8: Add the run command to the README**

In `agent/README.md`, add this line to the "Every day" block:
```
agent/.venv/Scripts/listen run                # start the agent (Ctrl+C stops it)
```

- [ ] **Step 9: Lint and commit**

Run: `agent/.venv/Scripts/ruff check agent` → `All checks passed!`
```
git add agent/listen_agent/shell agent/listen_agent/app.py agent/listen_agent/__main__.py agent/tests/shell agent/tests/test_app.py agent/tests/test_cli.py agent/README.md
git commit -m "Agent start-up: terminal shell, supervised workers, listen run with clean Ctrl+C stop"
```

---

### Task 9: Learning doc 10, "Stage 1: the foundations in code"

**Files:**
- Create: `docs/learning/10-stage-1-foundations.tex`
- Create: `docs/learning/10-stage-1-foundations.pdf` (built)

**Interfaces:**
- Consumes: the code from Tasks 1 to 8 (quote real snippets from it, not paraphrases).
- Produces: a PDF in the same style as Docs 01 to 09.

- [ ] **Step 1: Write the document**

Copy the preamble (everything before `\begin{document}`), the title block style and the `why` /
concept box environments from `docs/learning/09-errors-and-testing.tex`. Sections, each with a
short real snippet from the code and a "why" box:

1. **What stage 1 built:** TikZ diagram of `App` → `Supervisor` → worker threads, `EventBus` →
   inboxes, `TerminalShell`; what `listen run` does from start to Ctrl+C.
2. **Installing your own package:** virtual environment, `pip install -e "agent[dev]"` (editable,
   extras), `[project.scripts]` creating `listen.exe`, why pip + venv here instead of uv (uv is not
   installed; CI uses pip; the lock-file idea from Doc 02 still applies later).
3. **The command line:** `python -m` and `__main__.py`, argparse subcommands, exit codes 0 / 2 / 3
   and why the launcher treats 2 and 3 differently.
4. **Frozen dataclasses:** `@dataclass(frozen=True)`, `kw_only=True`, `default_factory`; why
   events shared between threads must be immutable; UTC-aware datetimes.
5. **Threads and queues:** `threading.Thread`, `threading.Event`, `queue.Queue.get(timeout=...)`,
   daemon threads, the `_NOTHING` sentinel and why `None` cannot be used.
6. **Publish/subscribe and the MRO:** how subscribing to `Event` receives every subclass;
   `__mro__` shown for `ModuleError`.
7. **Locks and race conditions:** what a race is, a two-thread example, why `publish` collects
   under the lock and delivers outside it.
8. **The supervisor:** the restart window as a sliding list of times (`deque`), hung detection
   from heartbeats, why Python can't kill a thread.
9. **Dependency injection and fakes:** passing `clock` and `out` instead of calling
   `time.monotonic` / `print` directly; `FakeClock`; how this makes a 30-second rule testable in
   microseconds.
10. **pytest tools used:** fixtures, `conftest.py`, `tmp_path`, `capsys`, `caplog`,
    `monkeypatch`, `parametrize`, `pytest.raises`; reading a failing test's output.
11. **Logging:** loggers, handlers, formatters, `RotatingFileHandler`; the `words()` rule.
12. **ruff and the first CI run:** what each selected rule family checks (E, F, I, B, UP); a
    screenshot-style description of the green run.

End with a glossary (alphabetical) and "Check yourself" questions, as in the other docs.

- [ ] **Step 2: Build the PDF and clean up**

Run (in `docs/learning`):
```
latexmk -pdf -interaction=nonstopmode 10-stage-1-foundations.tex
latexmk -c 10-stage-1-foundations.tex
```
Expected: `10-stage-1-foundations.pdf` exists; no `.aux/.log/.toc` files left (they are
git-ignored anyway). Open the PDF and check every page renders (no `??` references, no
overflowing code lines, `--` written as `-{}-` inside `\texttt`).

- [ ] **Step 3: Commit**

```
git add docs/learning/10-stage-1-foundations.tex docs/learning/10-stage-1-foundations.pdf
git commit -m "Add learning doc 10: stage 1 foundations in code"
```

- [ ] **Step 4: Ask the owner, then push**

Ask: "Stage 1 is done and committed locally. Push to GitHub?" After yes: `git push origin main`,
then confirm the `CI / agent` run is green.
