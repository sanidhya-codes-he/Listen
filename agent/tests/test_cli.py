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


def test_run_subcommand_starts_the_agent(monkeypatch):
    monkeypatch.setattr("listen_agent.__main__.run_agent", lambda: 7)
    assert main(["run"]) == 7


def test_help_lists_run(capsys):
    main([])
    assert "run" in capsys.readouterr().out
