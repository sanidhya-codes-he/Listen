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
