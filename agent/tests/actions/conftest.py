# fakes for action tests: nothing real opens, closes or focuses during pytest
from dataclasses import dataclass
from pathlib import Path

import pytest


@dataclass(frozen=True)
class FakeApp:
    name: str
    shortcut: Path
    target: Path | None


class FakeApps:
    """Stands in for the app index (S2-03): exact names only."""

    def __init__(self, *apps: FakeApp) -> None:
        self.by_name = {app.name.lower(): app for app in apps}

    def find(self, spoken):
        app = self.by_name.get(spoken.lower())
        return (app, 1.0) if app else None


class FakeSystem:
    """Records what Listen asked Windows to do, and plays back a fixed set of open windows."""

    def __init__(self, apps: FakeApps, windows: dict[Path, list[int]] | None = None) -> None:
        self.apps = apps
        self.windows = windows or {}
        self.calls: list[tuple] = []
        self.pid: int | None = 4321  # what launch() returns

    def open_url(self, url):
        self.calls.append(("open_url", url))

    def launch(self, shortcut):
        self.calls.append(("launch", shortcut))
        return self.pid

    def windows_of(self, program):
        return list(self.windows.get(program, []))

    def focus_window(self, window):
        self.calls.append(("focus_window", window))

    def close_window(self, window):
        self.calls.append(("close_window", window))


CODE = FakeApp(
    "Visual Studio Code", Path("C:/fake/Visual Studio Code.lnk"), Path("C:/fake/Code.exe"))
CALC = FakeApp("Calculator", Path("C:/fake/Calculator.lnk"), None)  # a store app: no target


@pytest.fixture
def system():
    return FakeSystem(FakeApps(CODE, CALC))


@pytest.fixture
def code():
    return CODE


@pytest.fixture
def calc():
    return CALC
