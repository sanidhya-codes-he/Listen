# events: frozen dataclasses that travel on the bus; each records when it was made (UTC)
from dataclasses import dataclass, field
from datetime import UTC, datetime


def _now() -> datetime:
    return datetime.now(UTC)


# kw_only: created_at goes last and by name, so subclasses can have required positional fields
@dataclass(frozen=True, kw_only=True)
class Event:
    created_at: datetime = field(default_factory=_now)


@dataclass(frozen=True)
class ModuleError(Event):
    """A worker caught an error; it keeps running."""

    module: str
    error: str
