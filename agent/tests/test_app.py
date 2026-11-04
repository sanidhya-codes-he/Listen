# tests for start-up and shut-down
import _thread
import threading
import time

import pytest

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


def test_bad_settings_exit_with_the_configuration_error_code():
    assert EXIT_BAD_SETTINGS == 78


def test_bad_settings_and_bad_command_lines_exit_differently():
    # argparse exits 2 for a wrong command line; the launcher must tell the two apart
    assert EXIT_BAD_SETTINGS not in (EXIT_OK, 1, 2, EXIT_FATAL)


def test_ctrl_c_stops_the_agent_cleanly(tmp_path):
    before = set(threading.enumerate())
    lines = []
    timers = []

    def out(line):
        lines.append(line)
        if line.startswith("Listen is ready"):
            # what Ctrl+C does: raise KeyboardInterrupt in the main thread
            timers.append(threading.Timer(0.2, _thread.interrupt_main))
            timers[-1].start()

    try:
        code = run_agent(settings_file=tmp_path / "settings.yaml", log_dir=tmp_path / "logs",
                         out=out)
    except KeyboardInterrupt:
        pytest.fail("the Ctrl+C escaped run_agent: it was not waiting for it")
    finally:
        for timer in timers:
            # if run_agent returned early, the interrupt must not hit pytest itself
            timer.cancel()
            timer.join()
    assert code == EXIT_OK
    assert "Stopping..." in lines
    assert "stopped (exit code 0)" in (tmp_path / "logs" / "listen.log").read_text(encoding="utf-8")
    assert set(threading.enumerate()) <= before


def test_a_fatal_supervisor_decision_stops_the_agent_with_code_3(tmp_path, monkeypatch):
    # calls App.fatal directly: the supervisor's checks run every 5 s, too slow for this test;
    # the supervisor -> fatal wiring is covered by on_fatal=self.fatal in App.__init__
    # and by the supervisor tests
    before = set(threading.enumerate())
    start = App.start

    def start_then_fail(self):
        start(self)
        threading.Timer(0.2, self.fatal, args=("shell stopped responding",)).start()

    monkeypatch.setattr(App, "start", start_then_fail)
    code = run_agent(settings_file=tmp_path / "settings.yaml", log_dir=tmp_path / "logs",
                     out=lambda line: None)
    assert code == EXIT_FATAL
    log_text = (tmp_path / "logs" / "listen.log").read_text(encoding="utf-8")
    assert "stopping: shell stopped responding" in log_text
    assert "stopped (exit code 3)" in log_text
    assert set(threading.enumerate()) <= before
