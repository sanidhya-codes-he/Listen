# tests for the app and URL primitives, against FakeSystem only
from pathlib import Path

import pytest

from listen_agent.actions.registry import ActionError, load_primitives, run


@pytest.fixture(autouse=True)
def primitives():
    load_primitives()


def test_open_url_opens_web_addresses(system):
    run("open_url", system, url="https://www.google.com/search?q=what+is+an+atom")
    assert system.calls == [("open_url", "https://www.google.com/search?q=what+is+an+atom")]


@pytest.mark.parametrize("url", ["file:///C:/my secret notes.txt", "javascript:alert(1)", ""])
def test_open_url_refuses_other_addresses_without_quoting_them(system, url):
    with pytest.raises(ActionError) as error:
        run("open_url", system, url=url)
    assert "secret" not in str(error.value)
    assert system.calls == []


def test_launch_app_starts_the_program_and_returns_its_process_id(system, code):
    assert run("launch_app", system, app="visual studio code") == 4321
    assert system.calls == [("launch", code.target)]


def test_a_store_app_starts_through_its_shortcut_without_a_process_id(system, calc):
    assert run("launch_app", system, app="calculator") is None
    assert system.calls == [("launch", calc.shortcut)]


@pytest.mark.parametrize("action", ["launch_app", "focus_app", "close_app"])
def test_only_installed_apps_without_quoting_the_spoken_name(system, action):
    # no "run any program": a name the app index doesn't know is refused
    with pytest.raises(ActionError) as error:
        run(action, system, app="my diary")
    assert "diary" not in str(error.value)
    assert system.calls == []


def test_focus_app_brings_its_first_window_forward(system, code):
    system.windows[code.target] = [11, 12]
    run("focus_app", system, app="visual studio code")
    assert system.calls == [("focus_window", 11)]


def test_close_app_politely_closes_every_window(system, code):
    system.windows[code.target] = [11, 12]
    assert run("close_app", system, app="visual studio code") == 2
    assert system.calls == [("close_window", 11), ("close_window", 12)]


@pytest.mark.parametrize("action", ["focus_app", "close_app"])
def test_an_app_that_is_not_running_is_reported(system, action):
    with pytest.raises(ActionError, match="not running"):
        run(action, system, app="visual studio code")


@pytest.mark.parametrize("action", ["focus_app", "close_app"])
def test_store_apps_cannot_be_found_by_their_windows_yet(system, action):
    with pytest.raises(ActionError, match="store app"):
        run(action, system, app="calculator")


def test_fakes_never_touch_real_programs():
    assert not Path("C:/fake").exists()
