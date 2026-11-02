# tests for the publish/subscribe event bus
import queue
import threading
import time
from collections import defaultdict
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


def test_threads_subscribing_to_a_new_event_type_at_once_are_all_kept(bus):
    # the race the lock prevents: several threads find "no list for this type yet", each makes
    # its own, and each overwrites the last, losing subscribers. Creating a list is normally too
    # fast to catch, so the test slows it down (a private detail, on purpose); without the lock
    # only 1 of the 8 inboxes keeps its subscription.
    def slow_new_list():
        time.sleep(0.01)
        return []

    bus._subscribers = defaultdict(slow_new_list)
    inboxes = [queue.Queue() for _ in range(8)]
    start = threading.Barrier(len(inboxes))

    def subscribe(inbox):
        start.wait()  # all threads subscribe at the same moment
        bus.subscribe(Ping, inbox)

    threads = [threading.Thread(target=subscribe, args=(inbox,)) for inbox in inboxes]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    bus.publish(Ping(1))
    assert [inbox.qsize() for inbox in inboxes] == [1] * len(inboxes)
