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
