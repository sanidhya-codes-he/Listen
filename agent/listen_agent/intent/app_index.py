# app index: installed apps by display name, read from the Start Menu's shortcuts
import difflib
import os
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from pathlib import Path

MATCH_THRESHOLD = 0.8  # spec §3.4; becomes a setting when the matcher is wired in (S2-16)


@dataclass(frozen=True)
class App:
    name: str
    shortcut: Path
    target: Path | None  # the program itself; None for store apps (launched via the shortcut)


def start_menu_folders() -> list[Path]:
    # current user first, so a personal shortcut wins over the all-users one with the same name
    programs = Path("Microsoft/Windows/Start Menu/Programs")
    return [Path(os.environ["APPDATA"]) / programs, Path(os.environ["PROGRAMDATA"]) / programs]


def read_targets(shortcuts: Iterable[Path]) -> dict[Path, str]:
    """The path each shortcut points at ("" when it has none), via Windows' scripting object."""
    import win32com.client  # Windows only: imported here so tests can run with a fake reader

    shell = win32com.client.Dispatch("WScript.Shell")
    return {path: shell.CreateShortcut(str(path)).TargetPath for path in shortcuts}


class AppIndex:
    def __init__(
        self,
        folders: Iterable[Path],
        read_targets: Callable[[list[Path]], dict[Path, str]] = read_targets,
        aliases: dict[str, str] | None = None,
        threshold: float = MATCH_THRESHOLD,
    ) -> None:
        self.folders = list(folders)
        self.read_targets = read_targets
        # cleaned like spoken names in find(), so "vs  code" in a command file still matches
        self.aliases = {" ".join(spoken.lower().split()): name
                        for spoken, name in (aliases or {}).items()}
        self.threshold = threshold
        self.rebuild()

    def rebuild(self) -> None:
        shortcuts = [path for folder in self.folders if folder.is_dir()
                     for path in sorted(folder.rglob("*.lnk"))]
        targets = self.read_targets(shortcuts)
        apps: dict[str, App] = {}
        for path in shortcuts:
            key, target = path.stem.lower(), targets.get(path, "")
            if "uninstall" in key or key in apps:
                continue  # uninstallers are not apps; the first shortcut with a name wins
            if target and not Path(target).exists():
                continue  # a broken link: the program it points at is gone
            apps[key] = App(path.stem, path, Path(target) if target else None)
        self.apps = apps

    def names(self) -> list[str]:
        return [app.name for app in self.apps.values()]

    def find(self, spoken: str) -> tuple[App, float] | None:
        """The app a spoken name means, with a similarity from 0 to 1, or None."""
        key = " ".join(spoken.lower().split())
        key = self.aliases.get(key, key).lower()
        if not key:
            return None
        if key in self.apps:
            return self.apps[key], 1.0
        scored = [(difflib.SequenceMatcher(None, key, name).ratio(), name) for name in self.apps]
        score, name = max(scored, default=(0.0, ""))
        return (self.apps[name], score) if score >= self.threshold else None
