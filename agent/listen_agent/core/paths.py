# where files live; other modules ask here instead of building paths themselves
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[2]
SETTINGS_FILE = AGENT_DIR / "settings.yaml"
LOG_DIR = AGENT_DIR / "logs"
