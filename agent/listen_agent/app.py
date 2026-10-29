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
