# apps: turn a spoken app name into an installed app, or its open windows (no "run any program")
from typing import Any

from listen_agent.actions.registry import ActionError


def installed_app(system: Any, name: str) -> Any:
    found = system.apps.find(name)
    if found is None:
        raise ActionError("no installed app matches that name")
    return found[0]


def app_windows(system: Any, name: str) -> list[int]:
    app = installed_app(system, name)
    if app.target is None:
        raise ActionError("a store app's windows can't be found yet (it has no program path)")
    windows = system.windows_of(app.target)
    if not windows:
        raise ActionError("that app is not running")
    return windows
