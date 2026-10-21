# tests for event objects
from dataclasses import FrozenInstanceError
from datetime import UTC, datetime, timedelta

import pytest

from listen_agent.core.events import ModuleError


def test_module_error_takes_module_and_error():
    event = ModuleError("voice", "OSError: no microphone")
    assert event.module == "voice"
    assert event.error == "OSError: no microphone"


def test_events_record_when_they_were_made_in_utc():
    event = ModuleError("voice", "x")
    assert event.created_at.tzinfo is UTC
    assert datetime.now(UTC) - event.created_at < timedelta(seconds=1)


def test_events_cannot_be_changed():
    event = ModuleError("voice", "x")
    with pytest.raises(FrozenInstanceError):
        event.module = "intent"
