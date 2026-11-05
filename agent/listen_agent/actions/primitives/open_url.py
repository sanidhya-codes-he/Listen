# open_url: open a web address in the default browser
from urllib.parse import urlparse

from listen_agent.actions.registry import ActionError, primitive


@primitive("open_url", params={"url": str})
def open_url(system, url):
    if urlparse(url).scheme not in ("http", "https"):
        raise ActionError("open_url: only http and https addresses can be opened")
    try:
        system.open_url(url)
    except OSError:
        # Python's message quotes the address, which may hold spoken words
        raise ActionError("open_url: the browser could not be started") from None
