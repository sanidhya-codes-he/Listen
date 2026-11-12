# registry: the allowlist of actions (one file each in actions/primitives/) and their parameters
import importlib
import pkgutil
from collections.abc import Callable
from typing import Any


class ActionError(Exception):
    """An action could not be done. Messages never quote spoken words (app names, URLs)."""


class AppNotInstalledError(ActionError):
    """Windows says the app's file or id is gone: the app index is stale (S2-16 rebuilds it)."""


_PRIMITIVES: dict[str, tuple[Callable[..., Any], dict[str, type]]] = {}


def primitive(name: str, params: dict[str, type]) -> Callable:
    """Register a function as the action `name`, taking these keyword parameters."""

    def register(func: Callable[..., Any]) -> Callable[..., Any]:
        if name in _PRIMITIVES:
            raise ValueError(f"primitive {name!r} is registered twice")
        _PRIMITIVES[name] = (func, dict(params))
        return func

    return register


def load_primitives() -> None:
    """Import every file in actions/primitives/, which registers its action."""
    from listen_agent.actions import primitives

    for module in pkgutil.iter_modules(primitives.__path__):
        importlib.import_module(f"{primitives.__name__}.{module.name}")


def list_primitives() -> list[str]:
    return sorted(_PRIMITIVES)


def run(name: str, system: Any, **params: Any) -> Any:
    """Check the action and its parameters, then do it. Raises ActionError."""
    if name not in _PRIMITIVES:
        raise ActionError(f"unknown action {name!r}")  # action names come from command files
    func, expected = _PRIMITIVES[name]
    missing, unexpected = sorted(expected.keys() - params), sorted(params.keys() - expected)
    if missing or unexpected:
        raise ActionError(f"{name}: missing {missing}, unexpected {unexpected}")
    for key, kind in expected.items():
        if not isinstance(params[key], kind):
            raise ActionError(f"{name}: {key} must be {kind.__name__}")
    return func(system, **params)
