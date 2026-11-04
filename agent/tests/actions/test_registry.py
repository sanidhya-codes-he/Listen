# tests for the primitive registry: the allowlist and its parameter checks
import pytest

from listen_agent.actions import registry
from listen_agent.actions.registry import ActionError, list_primitives, load_primitives, run


def test_every_primitive_file_is_loaded():
    load_primitives()
    assert {"open_url", "launch_app", "focus_app", "close_app"} <= set(list_primitives())


def test_loading_twice_registers_nothing_twice():
    load_primitives()
    before = list_primitives()
    load_primitives()
    assert list_primitives() == before


def test_a_name_registered_twice_is_refused(monkeypatch):
    monkeypatch.setattr(registry, "_PRIMITIVES", {})  # a private detail: start from an empty list
    registry.primitive("echo", params={})(lambda system: None)
    with pytest.raises(ValueError, match="echo"):
        registry.primitive("echo", params={})(lambda system: None)


@pytest.mark.parametrize(
    ("name", "params", "message"),
    [
        ("run_anything", {}, "unknown action 'run_anything'"),
        ("open_url", {}, "missing ['url']"),
        ("open_url", {"url": "https://a.b", "tab": 2}, "unexpected ['tab']"),
        ("open_url", {"url": 42}, "url must be str"),
    ],
)
def test_run_checks_the_action_and_its_parameters(system, name, params, message):
    load_primitives()
    with pytest.raises(ActionError) as error:
        run(name, system, **params)
    assert message in str(error.value)
    assert system.calls == []


def test_run_calls_the_primitive(system):
    load_primitives()
    run("open_url", system, url="https://example.com")
    assert system.calls == [("open_url", "https://example.com")]
