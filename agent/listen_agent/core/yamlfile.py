# yaml files: read one strictly, refusing duplicate keys that PyYAML would silently merge
from pathlib import Path

import yaml


class YamlFileError(Exception):
    """A YAML file can't be read or is invalid; the message starts with the file name."""


class _DuplicateKey(Exception):
    # raised inside the loader, which doesn't know the file name; load_yaml adds it
    def __init__(self, key: object, line: int) -> None:
        super().__init__(key, line)
        self.key = key
        self.line = line


class _StrictLoader(yaml.SafeLoader):
    """SafeLoader, except that a key repeated in the same mapping is an error."""

    def construct_mapping(self, node, deep=False):
        seen = set()
        for key_node, _ in node.value:
            key = self.construct_object(key_node, deep=deep)
            try:
                repeated = key in seen
            except TypeError:  # unhashable key (e.g. a list): the base class reports it
                continue
            if repeated:
                # marks count lines from 0; editors count from 1
                raise _DuplicateKey(key, key_node.start_mark.line + 1)
            seen.add(key)
        return super().construct_mapping(node, deep=deep)


def load_yaml(path: Path) -> object:
    """Read a YAML file; an empty file gives None. Raises YamlFileError naming the file."""
    try:
        # utf-8-sig also accepts files saved with a byte-order mark (Notepad does this)
        text = path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeDecodeError) as exc:
        raise YamlFileError(f"{path.name}: can't read it ({exc}); save it as UTF-8") from exc
    try:
        return yaml.load(text, Loader=_StrictLoader)
    except _DuplicateKey as dup:
        raise YamlFileError(f"{path.name}:{dup.line}: duplicate key {dup.key!r}") from None
    except yaml.YAMLError as exc:
        raise YamlFileError(f"{path.name}: not valid YAML ({exc})") from exc
