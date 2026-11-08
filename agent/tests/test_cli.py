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


def test_unknown_command_exits_2(capsys):
    with pytest.raises(SystemExit) as exit_info:
        main(["bogus"])
    assert exit_info.value.code == 2
    assert "invalid choice: 'bogus'" in capsys.readouterr().err


def test_commands_check_passes_on_the_starter_files(capsys):
    assert main(["commands", "check"]) == 0
    assert capsys.readouterr().out.strip().endswith("targets in 5 files: no problems")


def test_commands_check_lists_each_problem_and_exits_1(tmp_path, monkeypatch, capsys):
    (tmp_path / "core.yaml").write_text(
        "commands:\n  - id: bad\n    patterns: [x]\n    action: run_program\n", encoding="utf-8")
    monkeypatch.setattr("listen_agent.__main__.COMMANDS_DIR", tmp_path)
    assert main(["commands", "check"]) == 1
    out, err = capsys.readouterr()
    assert out.splitlines() == [
        "core.yaml:2: command 'bad': action: 'run_program' is not an allowed action",
        "0 commands, 0 targets in 1 file: 1 problem"]
    assert err == ""  # each problem once, not again through logging


def test_commands_alone_prints_its_help(capsys):
    assert main(["commands"]) == 0
    assert "check" in capsys.readouterr().out
