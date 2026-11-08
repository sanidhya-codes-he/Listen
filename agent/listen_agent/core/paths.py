# where files live; other modules ask here instead of building paths themselves
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[2]
SETTINGS_FILE = AGENT_DIR / "settings.yaml"
LOG_DIR = AGENT_DIR / "logs"
# shared with the server and the web app, so they live beside agent/, not inside it
COMMANDS_DIR = AGENT_DIR.parent / "commands"
RECIPE_SCHEMA = AGENT_DIR.parent / "shared" / "recipe.schema.json"
