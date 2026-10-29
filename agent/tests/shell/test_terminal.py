# tests for the terminal shell
from dataclasses import dataclass

from listen_agent.core.bus import EventBus
from listen_agent.core.events import Event, ModuleError
from listen_agent.shell.terminal import TerminalShell, describe


@dataclass(frozen=True)
class Ping(Event):
    n: int


def test_module_errors_name_the_module():
    assert describe(ModuleError("voice", "OSError: no mic")) == "error in voice: OSError: no mic"


def test_other_events_show_their_name():
    assert describe(Ping(1)) == "Ping"


def test_shell_prints_every_event_on_the_bus():
    bus = EventBus()
    lines = []
    shell = TerminalShell(bus, out=lines.append)
    bus.publish(Ping(1))
    bus.publish(ModuleError("voice", "x"))
    shell.run_once()
    shell.run_once()
    assert lines == ["Ping", "error in voice: x"]
