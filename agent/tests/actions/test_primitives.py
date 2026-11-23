# tests for the app and URL primitives, against FakeSystem only
import pytest

from listen_agent.actions.registry import ActionError, load_primitives, run

NOTEPAD_ID = "Microsoft.WindowsNotepad_8wekyb3d8bbwe!App"


@pytest.fixture(autouse=True)
def primitives():
    load_primitives()


def test_open_url_opens_web_addresses(system):
    run("open_url", system, url="https://www.google.com/search?q=what+is+an+atom")
    assert system.calls == [("open_url", "https://www.google.com/search?q=what+is+an+atom")]


# each refused address holds a private word, so "not quoted" means something for every case
@pytest.mark.parametrize("url", [
    "file:///C:/my secret notes.txt", "javascript:alert(secret)", "ftp://secret.example/",
    "secret"])
def test_open_url_refuses_other_addresses_without_quoting_them(system, url):
    with pytest.raises(ActionError) as error:
        run("open_url", system, url=url)
    assert "secret" not in str(error.value)
    assert system.calls == []


def test_a_browser_failure_does_not_quote_the_address(system, monkeypatch):
    def broken(url):
        raise OSError(f"cannot open {url}")

    monkeypatch.setattr(system, "open_url", broken)
    with pytest.raises(ActionError) as error:
        run("open_url", system, url="https://www.google.com/search?q=my+diary")
    assert "diary" not in str(error.value)
    assert error.value.__suppress_context__  # `from None`: the traceback leaves the original out


@pytest.mark.parametrize("name, pid", [("visual studio code", 4321), ("calculator", None)])
def test_launch_app_starts_the_shortcut_and_returns_the_process_id(system, name, pid):
    # the shortcut, like a double-click, so its arguments and "Start in" folder apply
    system.pid = pid  # the real system has no process id for store apps
    assert run("launch_app", system, app=name) == pid
    assert system.calls == [("launch", system.apps.find(name)[0].shortcut)]


def test_launch_app_starts_a_store_app_by_its_id(system):
    # a store app found only in shell:AppsFolder has no shortcut to double-click
    system.pid = None
    assert run("launch_app", system, app="notepad") is None
    assert system.calls == [("launch", rf"shell:AppsFolder\{NOTEPAD_ID}")]


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

