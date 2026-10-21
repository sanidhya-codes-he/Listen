# settings: read agent/settings.yaml into frozen objects; a bad value stops start-up
from collections.abc import Callable
from dataclasses import dataclass, field, fields
from pathlib import Path
from typing import Any

import yaml

MODES = ("wake", "continuous")
TOP_LEVEL = ("mode", "hotkeys", "thresholds")


class SettingsError(Exception):
    """settings.yaml is unreadable or has a bad value; the message starts with the key."""


@dataclass(frozen=True)
class Hotkeys:
    push_to_talk: str = "ctrl+alt+space"
    continuous_toggle: str = "ctrl+alt+c"


@dataclass(frozen=True)
class Thresholds:
    # placeholders until calibrated from marked right/wrong data (spec §3.6)
    hearing: float = 0.60
    match: float = 0.75
    high_risk_hearing: float = 0.75
    high_risk_match: float = 0.90
    continuous_extra: float = 0.10


@dataclass(frozen=True)
class Settings:
    mode: str = "wake"
    hotkeys: Hotkeys = field(default_factory=Hotkeys)
    thresholds: Thresholds = field(default_factory=Thresholds)


def load_settings(path: Path) -> Settings:
    """Read settings.yaml. A missing or empty file means all defaults."""
    if not path.exists():
        return Settings()
    try:
        # utf-8-sig also accepts files saved with a byte-order mark (Notepad does this)
        text = path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeDecodeError) as exc:
        raise SettingsError(f"{path.name}: can't read it ({exc}); save it as UTF-8") from exc
    try:
        raw = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        raise SettingsError(f"{path.name}: not valid YAML ({exc})") from exc
    raw = raw or {}
    if not isinstance(raw, dict):
        raise SettingsError(f"{path.name}: expected keys at the top level")
    for key in raw:
        if key not in TOP_LEVEL:
            raise SettingsError(f"{key}: unknown setting")
    mode = raw.get("mode", "wake")
    if mode not in MODES:
        raise SettingsError(f"mode: must be one of {', '.join(MODES)}, got {mode!r}")
    return Settings(
        mode=mode,
        hotkeys=_section(raw, "hotkeys", Hotkeys, _hotkey),
        thresholds=_section(raw, "thresholds", Thresholds, _threshold),
    )


def _section(raw: dict, name: str, cls: type, check: Callable[[str, Any], Any]) -> Any:
    # one nested block (hotkeys, thresholds): every key must exist and pass its check
    values = raw.get(name)
    if values is None:
        return cls()
    if not isinstance(values, dict):
        raise SettingsError(f"{name}: expected keys under it")
    known = {f.name for f in fields(cls)}
    checked = {}
    for key, value in values.items():
        if key not in known:
            raise SettingsError(f"{name}.{key}: unknown setting")
        checked[key] = check(f"{name}.{key}", value)
    return cls(**checked)


def _hotkey(key: str, value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise SettingsError(f"{key}: must be a key combination like ctrl+alt+space")
    return value.strip()


def _threshold(key: str, value: Any) -> float:
    # bool is a kind of int in Python, so "yes" (read as True) must be refused explicitly
    if isinstance(value, bool) or not isinstance(value, int | float) or not 0 <= value <= 1:
        raise SettingsError(f"{key}: must be a number from 0 to 1, got {value!r}")
    return float(value)
