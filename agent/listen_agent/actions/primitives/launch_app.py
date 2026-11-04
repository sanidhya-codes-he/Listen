# launch_app: start an installed app; returns its process id (for undo), None for a store app
from listen_agent.actions.apps import installed_app
from listen_agent.actions.registry import primitive


@primitive("launch_app", params={"app": str})
def launch_app(system, app):
    found = installed_app(system, app)
    return system.launch(found.target or found.shortcut)
