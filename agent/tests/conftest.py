# shared test helpers: a clock the test controls
import pytest


class FakeClock:
    """Stands in for time.monotonic; time moves only when a test calls advance()."""

    def __init__(self, start: float = 1000.0) -> None:
        self.now = start

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()
