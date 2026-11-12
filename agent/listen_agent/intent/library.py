# command library: commands/*.yaml checked against the recipe schema, merged, reloaded on change
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from listen_agent.core.paths import COMMANDS_DIR, RECIPE_SCHEMA
from listen_agent.core.yamlfile import YamlFileError, load_yaml

log = logging.getLogger("intent")


@dataclass(frozen=True)
class Command:
    file: str
    line: int
    id: str
    patterns: tuple[str, ...]
    action: str | None  # None for a routine, which has steps instead
    params: dict
    url_from: str | None
    steps: tuple[dict, ...]
    when_app: str | None
    focus_first: bool
    risk: str
    continuous: str
    undo: dict | None


@dataclass(frozen=True)
class CommandLibrary:
    """Everything valid in commands/, merged; problems holds one warning per skipped entry."""

    targets: dict[str, dict]
    defaults: dict[str, str]
    aliases: dict[str, str]
    commands: tuple[Command, ...]
    problems: tuple[str, ...]


def _explain(error) -> str:
    # jsonschema's message, in plain words where its own is unreadable
    where = ".".join(str(part) for part in error.path)
    prefix = f"{where}: " if where else ""
    if error.validator == "additionalProperties":
        unknown = sorted(set(error.instance) - set(error.schema.get("properties", {})))
        return prefix + ", ".join(f"unknown key {key!r}" for key in unknown)
    if error.validator == "oneOf":  # the only oneOf: action or steps
        both = "action" in error.instance and "steps" in error.instance
        return "needs either 'action' or 'steps'" + (", not both" if both else "")
    if error.validator == "required" and "'when_app'" in error.message:
        return "press_keys needs 'when_app' (the app it may press keys in)"
    if error.validator == "enum" and error.path and error.path[-1] == "action":
        return f"{prefix}{error.instance!r} is not an allowed action"
    if error.validator == "enum":
        allowed = ", ".join(map(repr, error.validator_value))
        return f"{prefix}{error.instance!r} is not one of {allowed}"
    if error.validator == "pattern":  # the only pattern: slot names in a sentence
        slots = "{query}, {target}, {app} or {number}"
        return f"{prefix}{error.instance!r}: a slot must be {slots}"
    return prefix + error.message


class CommandFiles:
    """The commands/ folder. .library is the current CommandLibrary; reload_if_changed() replaces
    it, in one assignment, when a file was added, edited or deleted."""

    def __init__(self, folder: Path = COMMANDS_DIR, schema_file: Path = RECIPE_SCHEMA) -> None:
        self.folder = folder
        schema = json.loads(schema_file.read_text(encoding="utf-8"))

        def validator(part: dict) -> Draft202012Validator:
            # a part of the schema checked on its own; $defs come along so its $refs resolve
            return Draft202012Validator({"$defs": schema["$defs"], **part})

        self._file = Draft202012Validator(schema)
        self._target = validator({"$ref": "#/$defs/target"})
        self._command = validator({"$ref": "#/$defs/command"})
        self._name = validator(schema["properties"]["defaults"]["additionalProperties"])
        self._last_good: dict[str, Any] = {}  # file name -> its last data that parsed
        self._snapshot = self._take_snapshot()
        self.library = self._build()

    def reload_if_changed(self) -> bool:
        """Rebuild if any file was added, edited or deleted; returns whether it did."""
        snapshot = self._take_snapshot()
        if snapshot == self._snapshot:
            return False
        self._snapshot = snapshot
        self.library = self._build()  # one assignment: a reader sees the old or the new, whole
        return True

    def _take_snapshot(self) -> dict[str, tuple[int, int]]:
        snapshot = {}
        for path in sorted(self.folder.glob("*.yaml")):
            try:
                stat = path.stat()
            except OSError:
                continue  # deleted between listing and looking: it is gone
            snapshot[path.name] = (stat.st_mtime_ns, stat.st_size)
        return snapshot

    def _read(self, name: str, problems: list[str]) -> Any:
        # a file's data, or its last good data when it can't be read now, or None
        try:
            data = load_yaml(self.folder / name)
            if data is not None and not isinstance(data, dict):
                raise YamlFileError(f"{name}: the top level must be a mapping "
                                    "(targets, defaults, aliases, commands)")
        except YamlFileError as error:
            if name in self._last_good:
                problems.append(f"{error}; using the last good version")
                return self._last_good[name]
            problems.append(str(error))
            return None
        self._last_good[name] = data
        return data

    def _build(self) -> CommandLibrary:
        for gone in set(self._last_good) - set(self._snapshot):
            del self._last_good[gone]
        problems: list[str] = []
        found: dict[str, dict] = {"targets": {}, "defaults": {}, "aliases": {}, "commands": {}}
        where: dict[tuple[str, Any], str] = {}  # (section, key) -> "a.yaml:2", to name both
        for name in self._snapshot:  # sorted: earlier files win ties and duplicates
            self._merge(name, self._read(name, problems) or {}, found, where, problems)
        for verb, target in list(found["defaults"].items()):
            if target not in found["targets"]:
                problems.append(f"{where['defaults', verb]}: default {verb!r}: "
                                f"no target named {target!r}; skipped")
                del found["defaults"][verb]
        for problem in problems:
            log.warning(problem)
        return CommandLibrary(found["targets"], found["defaults"], found["aliases"],
                              tuple(found["commands"].values()), tuple(problems))

    def _merge(self, name: str, data: dict, found: dict[str, dict],
               where: dict[tuple[str, Any], str], problems: list[str]) -> None:
        """Check one file's entries, each on its own; add the valid ones not seen before."""
        skipped = set()
        for error in self._file.iter_errors(data):
            if len(error.path) > 1:
                continue  # inside a section: each entry is checked on its own below
            if error.validator == "additionalProperties" and not error.path:
                for section in sorted(set(data) - set(error.schema["properties"])):
                    problems.append(f"{name}:{data.line}: unknown section {section!r}")
                    skipped.add(section)
            else:
                problems.append(f"{name}:{getattr(data, 'line', 1)}: {_explain(error)}")
                skipped.update(error.path)

        checks = {"targets": (self._target, "target"), "defaults": (self._name, "default"),
                  "aliases": (self._name, "alias"), "commands": (self._command, "command")}
        for section, (check, label) in checks.items():
            if section not in data or section in skipped:
                continue
            entries = data[section]
            # option A (owner, 2026-11-08): each entry's own line: where a command starts, or the
            # line of a target's, default's or alias's key; else its section's first line
            if section == "commands":  # a list: key each entry by its id
                pairs = [(_command_key(entry, index), entry, getattr(entry, "line", 0))
                         for index, entry in enumerate(entries)]
            else:
                key_lines = getattr(entries, "key_lines", {})
                pairs = [(key, entry, key_lines.get(key, 0)) for key, entry in entries.items()]
            for key, entry, line in pairs:
                section_line = getattr(data, "key_lines", {}).get(section, 1)  # "commands:"
                at = f"{name}:{line or getattr(entries, 'line', 0) or section_line}"
                errors = "; ".join(_explain(error) for error in check.iter_errors(entry))
                if errors:
                    problems.append(f"{at}: {label} {key!r}: {errors}")
                elif (section, key) in where:
                    problems.append(f"{at}: {label} {key!r}: already defined at "
                                    f"{where[section, key]}; skipped")
                else:
                    where[section, key] = at
                    found[section][key] = (_command_from(name, entry) if section == "commands"
                                           else entry)



def check_commands(folder: Path = COMMANDS_DIR, out=print) -> int:
    """`listen commands check`: print every problem and a summary; 1 if there are any."""
    if not folder.is_dir():  # the agent loads nothing here; the check must not say "no problems"
        out(f"{folder}: no such folder")
        return 1
    # printed here, once: the warnings CommandFiles logs would repeat each one on stderr
    log.disabled = True
    try:
        library = CommandFiles(folder).library
    finally:
        log.disabled = False
    for problem in library.problems:
        out(problem)
    found = (f"{_count(len(library.commands), 'command')}, "
             f"{_count(len(library.targets), 'target')} in "
             f"{_count(len(list(folder.glob('*.yaml'))), 'file')}")
    problems = _count(len(library.problems), "problem") if library.problems else "no problems"
    out(f"{found}: {problems}")
    return 1 if library.problems else 0


def _count(n: int, word: str) -> str:
    return f"{n} {word}" + ("" if n == 1 else "s")


def _command_key(entry: Any, index: int) -> Any:
    # its id, or its position when it has none (the schema then reports the missing id)
    return entry.get("id", f"#{index + 1}") if isinstance(entry, dict) else f"#{index + 1}"


# spec §3.6: actions that are high risk when the file doesn't say (a routine's action is None: low)
ACTION_RISK = {"close_app": "high"}


def _command_from(file: str, entry: dict) -> Command:
    action = entry.get("action")
    risk = entry.get("risk", ACTION_RISK.get(action, "low"))
    return Command(
        file=file, line=entry.line, id=entry["id"], patterns=tuple(entry["patterns"]),
        action=action, params=dict(entry.get("params", {})), url_from=entry.get("url_from"),
        steps=tuple(dict(step) for step in entry.get("steps", [])),
        when_app=entry.get("when_app"), focus_first=entry.get("focus_first", False),
        risk=risk,
        # owner, 2026-11-12: every high-risk command asks first in continuous mode (spec §3.7),
        # so a new risky command needs only `risk: high` in YAML
        continuous=entry.get("continuous", "confirm" if risk == "high" else "allow"),
        undo=entry.get("undo"))
