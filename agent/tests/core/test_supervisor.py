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
