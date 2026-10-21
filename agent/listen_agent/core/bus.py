# event bus: publish/subscribe between modules; delivers each event into subscribers' inboxes
import queue
import threading
from collections import defaultdict

from listen_agent.core.events import Event


class EventBus:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._subscribers: dict[type[Event], list[queue.Queue]] = defaultdict(list)

    def subscribe(self, event_type: type[Event], inbox: queue.Queue) -> None:
        with self._lock:
            if inbox not in self._subscribers[event_type]:
                self._subscribers[event_type].append(inbox)

    def publish(self, event: Event) -> None:
        # collect under the lock, deliver outside it so a slow put never blocks subscribe()
        with self._lock:
            inboxes: list[queue.Queue] = []
            for cls in type(event).__mro__:  # the class, its parents, ..., Event, object
                for inbox in self._subscribers.get(cls, ()):
                    if inbox not in inboxes:
                        inboxes.append(inbox)
        for inbox in inboxes:
            inbox.put(event)
