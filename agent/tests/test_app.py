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
