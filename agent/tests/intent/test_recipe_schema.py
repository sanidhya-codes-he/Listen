# tests for the recipe schema itself: the one definition of a valid command file
import json

import pytest
from jsonschema import Draft202012Validator

from listen_agent.core.paths import RECIPE_SCHEMA

# spec §3.5, written out here on purpose: the schema must match the spec, not itself
ALLOWLIST = ["open_url", "launch_app", "close_app", "set_volume", "change_volume", "toggle_mute",
             "press_keys", "focus_app"]


@pytest.fixture(scope="module")
def schema():
    return json.loads(RECIPE_SCHEMA.read_text(encoding="utf-8"))


def test_the_schema_is_a_valid_draft_2020_12_schema(schema):
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    Draft202012Validator.check_schema(schema)


def test_actions_are_exactly_the_allowlist(schema):
    assert sorted(schema["$defs"]["action"]["enum"]) == sorted(ALLOWLIST)


def test_doc_03s_example_file_is_valid(schema):
    example = {
        "version": 1,
        "targets": {"google": {"search": "https://www.google.com/search?q={query}",
                               "home": "https://www.google.com"}},
        "defaults": {"search": "google"},
        "aliases": {"chrome": "Google Chrome"},
        "commands": [
            {"id": "search", "patterns": ["search {query} on {target}", "search {query}"],
             "action": "open_url", "url_from": "search"},
            {"id": "volume_up", "patterns": ["volume up"], "action": "change_volume",
             "params": {"step": 10}},
            {"id": "dsa", "patterns": ["start dsa"],
             "steps": [{"action": "launch_app", "params": {"app": "CLion"}}]},
        ],
    }
    assert list(Draft202012Validator(schema).iter_errors(example)) == []
