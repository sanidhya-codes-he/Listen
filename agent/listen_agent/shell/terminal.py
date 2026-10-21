# terminal shell (v1): prints one line per bus event (spec §4.8)
from collections.abc import Callable

from listen_agent.core.bus import EventBus
from listen_agent.core.events import Event, ModuleError
from listen_agent.core.worker import Worker


def describe(event: Event) -> str:
    # stage 2 adds a line format for each voice and command event
    if isinstance(event, ModuleError):
        return f"error in {event.module}: {event.error}"
    return type(event).__name__


class TerminalShell(Worker):
    name = "shell"

    def __init__(self, bus: EventBus, out: Callable[[str], None] = print, **kwargs) -> None:
        super().__init__(bus, **kwargs)
        self.out = out
        bus.subscribe(Event, self.inbox)

    def handle(self, message: object) -> None:
        self.out(describe(message))
