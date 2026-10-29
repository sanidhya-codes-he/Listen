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
        self._last_check = clock()

    def start(self) -> None:
        self._last_check = self.clock()
        for worker in self.workers:
            self._start_thread(worker)

    def check(self) -> None:
        now = self.clock()
        gap = now - self._last_check
        self._last_check = now
        if gap > HUNG_AFTER:
            # checks run every 5 s, so a gap this long means the whole laptop slept:
            # nobody beat because nothing ran, not because a worker hung
            log.warning("clock jumped %.0f s (sleep?); heartbeats reset", gap)
            for worker in self.workers:
                worker.beat()
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
